import { createHash, randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse
} from '@simplewebauthn/server';

initializeApp();
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const rpId = defineString('WEBAUTHN_RP_ID');
const origin = defineString('WEBAUTHN_ORIGIN');
const db = getFirestore();
const challengeLifetimeMs = 5 * 60 * 1000;
const maxCredentialsPerUser = 5;
const authenticationRateWindowMs = 60 * 1000;
const maxAuthenticationAttemptsPerWindow = 30;
const onBiometricCall = (handler) => onCall({ cors: true }, handler);

function requireAuthenticatedUser(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before managing biometric authentication.');
  }
  return request.auth;
}

function requireRecentAuthentication(authContext) {
  const authTime = Number(authContext.token.auth_time);
  if (!Number.isFinite(authTime) || Date.now() - authTime * 1000 > challengeLifetimeMs) {
    throw new HttpsError('failed-precondition', 'Sign in again before registering a passkey.');
  }
}

function requireSessionId(sessionId) {
  if (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    throw new HttpsError('invalid-argument', 'The authentication session is invalid.');
  }
}

async function saveChallenge({ challenge, operation, uid }) {
  const sessionId = randomUUID();
  await db.collection('webauthnChallenges').doc(sessionId).create({
    challenge,
    operation,
    uid: uid || null,
    expiresAt: Timestamp.fromMillis(Date.now() + challengeLifetimeMs)
  });
  return sessionId;
}

async function enforceAuthenticationRateLimit(request) {
  const clientIp = request.rawRequest?.ip || 'unknown';
  const rateLimitId = createHash('sha256').update(clientIp).digest('base64url');
  const rateLimitRef = db.collection('webauthnRateLimits').doc(rateLimitId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateLimitRef);
    const now = Date.now();
    const data = snapshot.data();
    const windowStart = data?.windowStart instanceof Timestamp ? data.windowStart.toMillis() : 0;
    const count = now - windowStart < authenticationRateWindowMs ? Number(data?.count) || 0 : 0;
    if (count >= maxAuthenticationAttemptsPerWindow) {
      throw new HttpsError('resource-exhausted', 'Too many passkey attempts. Wait a minute and try again.');
    }
    transaction.set(rateLimitRef, {
      windowStart: Timestamp.fromMillis(count === 0 ? now : windowStart),
      count: count + 1,
      expiresAt: Timestamp.fromMillis(now + authenticationRateWindowMs * 2)
    });
  });
}

async function consumeChallenge({ sessionId, operation, uid }) {
  requireSessionId(sessionId);
  const challengeRef = db.collection('webauthnChallenges').doc(sessionId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(challengeRef);
    const data = snapshot.data();
    if (
      !snapshot.exists
      || data?.operation !== operation
      || (uid && data.uid !== uid)
      || !(data.expiresAt instanceof Timestamp)
      || data.expiresAt.toMillis() <= Date.now()
    ) {
      throw new HttpsError('failed-precondition', 'The authentication request expired or was already used.');
    }
    transaction.delete(challengeRef);
    return data.challenge;
  });
}

function requireWebAuthnResponse(response) {
  if (!response || typeof response !== 'object' || typeof response.id !== 'string') {
    throw new HttpsError('invalid-argument', 'The passkey response is invalid.');
  }
}

export const getBiometricStatus = onBiometricCall(async (request) => {
  const { uid } = requireAuthenticatedUser(request);
  const credentials = await db.collection('webauthnCredentials')
    .where('uid', '==', uid)
    .limit(1)
    .get();
  return { enabled: !credentials.empty };
});

export const beginBiometricEnrollment = onBiometricCall(async (request) => {
  const authContext = requireAuthenticatedUser(request);
  requireRecentAuthentication(authContext);
  const profile = await db.collection('users').doc(authContext.uid).get();
  if (!profile.exists || ['pending', 'rejected'].includes(profile.data()?.approvalStatus)) {
    throw new HttpsError('permission-denied', 'Only approved accounts can register a passkey.');
  }
  const account = await getAuth().getUser(authContext.uid);
  const existing = await db.collection('webauthnCredentials')
    .where('uid', '==', authContext.uid)
    .get();
  if (existing.size >= maxCredentialsPerUser) {
    throw new HttpsError('resource-exhausted', 'Remove an existing passkey before adding another device.');
  }

  const options = await generateRegistrationOptions({
    rpName: 'Sales POS',
    rpID: rpId.value(),
    userID: Buffer.from(authContext.uid),
    userName: account.email || authContext.uid,
    userDisplayName: account.displayName || account.email || authContext.uid,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      userVerification: 'required'
    },
    excludeCredentials: existing.docs.map((credential) => ({
      id: credential.id,
      transports: credential.data().transports
    }))
  });
  const sessionId = await saveChallenge({
    challenge: options.challenge,
    operation: 'enroll',
    uid: authContext.uid
  });
  return { options, sessionId };
});

export const completeBiometricEnrollment = onBiometricCall(async (request) => {
  const authContext = requireAuthenticatedUser(request);
  requireRecentAuthentication(authContext);
  const response = request.data?.response;
  requireWebAuthnResponse(response);
  const expectedChallenge = await consumeChallenge({
    sessionId: request.data?.sessionId,
    operation: 'enroll',
    uid: authContext.uid
  });

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin.value(),
      expectedRPID: rpId.value(),
      requireUserVerification: true
    });
  } catch (error) {
    console.warn('Passkey registration verification failed', error);
    throw new HttpsError('invalid-argument', 'The passkey could not be verified. Please try again.');
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new HttpsError('permission-denied', 'The authenticator did not verify the registration.');
  }

  const credential = verification.registrationInfo.credential;
  const credentialRef = db.collection('webauthnCredentials').doc(credential.id);
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(credentialRef);
    if (existing.exists && existing.data()?.uid !== authContext.uid) {
      throw new HttpsError('already-exists', 'This passkey is already registered to another account.');
    }
    transaction.set(credentialRef, {
      uid: authContext.uid,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: credential.transports || [],
      active: true,
      createdAt: Timestamp.now()
    });
  });
  return { enabled: true };
});

export const beginBiometricAuthentication = onBiometricCall(async (request) => {
  await enforceAuthenticationRateLimit(request);
  const activeCredentials = await db.collection('webauthnCredentials')
    .where('active', '==', true)
    .limit(1)
    .get();
  if (activeCredentials.empty) {
    throw new HttpsError('failed-precondition', 'Sign in with your password before using biometric unlock.');
  }
  const options = await generateAuthenticationOptions({
    rpID: rpId.value(),
    allowCredentials: [],
    userVerification: 'required'
  });
  const sessionId = await saveChallenge({
    challenge: options.challenge,
    operation: 'authenticate'
  });
  return { options, sessionId };
});

export const completeBiometricAuthentication = onBiometricCall(async (request) => {
  const response = request.data?.response;
  requireWebAuthnResponse(response);
  const expectedChallenge = await consumeChallenge({
    sessionId: request.data?.sessionId,
    operation: 'authenticate'
  });
  const credentialRef = db.collection('webauthnCredentials').doc(response.id);
  const credentialSnapshot = await credentialRef.get();
  if (!credentialSnapshot.exists) {
    throw new HttpsError('permission-denied', 'This device is not registered for biometric sign-in.');
  }

  const storedCredential = credentialSnapshot.data();
  if (storedCredential.active !== true) {
    throw new HttpsError('permission-denied', 'Sign in with your password before using biometric unlock.');
  }
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin.value(),
      expectedRPID: rpId.value(),
      credential: {
        id: credentialSnapshot.id,
        publicKey: Buffer.from(storedCredential.publicKey, 'base64url'),
        counter: storedCredential.counter,
        transports: storedCredential.transports
      },
      requireUserVerification: true
    });
  } catch (error) {
    console.warn('Passkey authentication verification failed', error);
    throw new HttpsError('permission-denied', 'The passkey could not be verified.');
  }

  if (!verification.verified) {
    throw new HttpsError('permission-denied', 'The authenticator did not verify the sign-in.');
  }

  const profile = await db.collection('users').doc(storedCredential.uid).get();
  if (
    !profile.exists
    || ['pending', 'rejected'].includes(profile.data()?.approvalStatus)
  ) {
    throw new HttpsError('permission-denied', 'This account is not approved to use the application.');
  }
  const user = await getAuth().getUser(storedCredential.uid);
  if (user.disabled) {
    throw new HttpsError('permission-denied', 'This account is disabled.');
  }

  await db.runTransaction(async (transaction) => {
    const latestCredential = await transaction.get(credentialRef);
    const latestCounter = latestCredential.data()?.counter;
    if (
      !latestCredential.exists
      || latestCredential.data()?.uid !== storedCredential.uid
      || latestCredential.data()?.active !== true
      || (
        verification.authenticationInfo.newCounter > 0
        && Number(latestCounter) >= verification.authenticationInfo.newCounter
      )
    ) {
      throw new HttpsError('permission-denied', 'The passkey counter is invalid. Sign in with your password.');
    }
    transaction.update(credentialRef, {
      counter: Math.max(Number(latestCounter) || 0, verification.authenticationInfo.newCounter)
    });
  });
  const customToken = await getAuth().createCustomToken(storedCredential.uid);
  return { customToken };
});

export const removeBiometricCredentials = onBiometricCall(async (request) => {
  const { uid } = requireAuthenticatedUser(request);
  const credentials = await db.collection('webauthnCredentials')
    .where('uid', '==', uid)
    .get();
  const batch = db.batch();
  credentials.docs.forEach((credential) => batch.delete(credential.ref));
  if (!credentials.empty) await batch.commit();
  return { removed: credentials.size };
});

export const deactivateBiometricCredentials = onBiometricCall(async (request) => {
  const { uid } = requireAuthenticatedUser(request);
  const credentials = await db.collection('webauthnCredentials')
    .where('uid', '==', uid)
    .get();
  const batch = db.batch();
  credentials.docs.forEach((credential) => {
    batch.update(credential.ref, { active: false });
  });
  if (!credentials.empty) await batch.commit();
  return { deactivated: credentials.size };
});

export const activateBiometricCredentials = onBiometricCall(async (request) => {
  const { uid } = requireAuthenticatedUser(request);
  const credentials = await db.collection('webauthnCredentials')
    .where('uid', '==', uid)
    .get();
  const batch = db.batch();
  credentials.docs.forEach((credential) => {
    batch.update(credential.ref, { active: true });
  });
  if (!credentials.empty) await batch.commit();
  return { activated: credentials.size };
});
