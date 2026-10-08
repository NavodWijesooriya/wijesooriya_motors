import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from '@simplewebauthn/browser';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';

const functions = getFunctions(app, 'asia-south1');

interface BiometricOptions<TOptions> {
  options: TOptions;
  sessionId: string;
}

const beginEnrollment = httpsCallable<void, BiometricOptions<PublicKeyCredentialCreationOptionsJSON>>(
  functions,
  'beginBiometricEnrollment'
);
const completeEnrollment = httpsCallable<
  { sessionId: string; response: RegistrationResponseJSON },
  { enabled: boolean }
>(functions, 'completeBiometricEnrollment');
const beginAuthentication = httpsCallable<void, BiometricOptions<PublicKeyCredentialRequestOptionsJSON>>(
  functions,
  'beginBiometricAuthentication'
);
const completeAuthentication = httpsCallable<
  { sessionId: string; response: AuthenticationResponseJSON },
  { customToken: string }
>(functions, 'completeBiometricAuthentication');
const getStatus = httpsCallable<void, { enabled: boolean }>(functions, 'getBiometricStatus');
const removeCredentials = httpsCallable<void, { removed: number }>(
  functions,
  'removeBiometricCredentials'
);
const deactivateCredentials = httpsCallable<void, { deactivated: number }>(
  functions,
  'deactivateBiometricCredentials'
);
const activateCredentials = httpsCallable<void, { activated: number }>(
  functions,
  'activateBiometricCredentials'
);

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (
    !window.isSecureContext
    || !('PublicKeyCredential' in window)
    || typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    return false;
  }

  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export async function registerBiometricCredential(): Promise<void> {
  const { data: registration } = await beginEnrollment();
  const response = await startRegistration({ optionsJSON: registration.options });
  await completeEnrollment({ sessionId: registration.sessionId, response });
}

export async function authenticateBiometricCredential(): Promise<string> {
  const { data: authentication } = await beginAuthentication();
  const response = await startAuthentication({ optionsJSON: authentication.options });
  const { data } = await completeAuthentication({
    sessionId: authentication.sessionId,
    response
  });
  return data.customToken;
}

export async function getBiometricEnrollmentStatus(): Promise<boolean> {
  const { data } = await getStatus();
  return data.enabled;
}

export async function deactivateBiometricSignIn(): Promise<void> {
  await deactivateCredentials();
}

export async function activateBiometricSignIn(): Promise<number> {
  const { data } = await activateCredentials();
  return data.activated;
}

export async function revokeBiometricCredentials(): Promise<void> {
  await removeCredentials();
}
