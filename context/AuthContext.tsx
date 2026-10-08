'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import {
  authenticateBiometricCredential,
  activateBiometricSignIn,
  deactivateBiometricSignIn,
  getBiometricEnrollmentStatus,
  registerBiometricCredential,
  revokeBiometricCredentials
} from '@/src/lib/biometricAuth';
import { LoadingScreen } from '../src/components/LoadingScreen';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'unregistered';

export interface UserProfile {
  businessName: string;
  email?: string;
  role: 'admin' | 'user';
  approvalStatus: ApprovalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  approvalStatus: ApprovalStatus;
  approvalStatusVerified: boolean;
  loading: boolean;
  authError: string | null;
  authNotice: string | null;
  biometricEnabled: boolean;
  biometricStatusLoading: boolean;
  biometricStatusError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  registerAccount: (email: string, password: string) => Promise<void>;
  unlockWithBiometrics: () => Promise<void>;
  confirmBiometricSetup: (password: string) => Promise<void>;
  enableBiometrics: () => Promise<void>;
  disableBiometrics: () => Promise<void>;
  refreshBiometricStatus: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthNotice: () => void;
  saveBusinessName: (businessName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
  approvalStatus: 'unregistered',
  approvalStatusVerified: false,
  loading: true,
  authError: null,
  authNotice: null,
  biometricEnabled: false,
  biometricStatusLoading: false,
  biometricStatusError: null,
  signIn: async () => {
    throw new Error('Authentication is required to sign in.');
  },
  registerAccount: async () => {
    throw new Error('Authentication is required to register.');
  },
  unlockWithBiometrics: async () => {
    throw new Error('Biometric authentication is not initialized.');
  },
  confirmBiometricSetup: async () => {
    throw new Error('Authentication is required to enable biometrics.');
  },
  enableBiometrics: async () => {
    throw new Error('Authentication is required to enable biometrics.');
  },
  disableBiometrics: async () => {
    throw new Error('Authentication is required to disable biometrics.');
  },
  refreshBiometricStatus: async () => {
    throw new Error('Authentication is not initialized.');
  },
  logout: async () => {
    throw new Error('Authentication is not initialized.');
  },
  clearAuthNotice: () => undefined,
  saveBusinessName: async () => {
    throw new Error('Authentication is required to save a business name.');
  }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('unregistered');
  const [approvalStatusVerified, setApprovalStatusVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionSetupPending, setSessionSetupPending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricStatusLoading, setBiometricStatusLoading] = useState(false);
  const [biometricStatusError, setBiometricStatusError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeRole: (() => void) | undefined;
    let accessRevocationRequested = false;
    let initialAuthStateResolved = false;
    let sessionLockRequested = false;

    const lockSession = () => {
      if (!auth.currentUser || sessionLockRequested) return;
      sessionLockRequested = true;
      setLoading(true);
      void signOut(auth).catch((error) => {
        console.error('Failed to lock the app after it was backgrounded', error);
        sessionLockRequested = false;
        setAuthError('The app could not securely lock. Check your connection, then retry or sign out.');
        setLoading(false);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') lockSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', lockSession);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!initialAuthStateResolved) {
        initialAuthStateResolved = true;
        if (currentUser) {
          sessionLockRequested = true;
          setLoading(true);
          void signOut(auth).catch((error) => {
            console.error('Failed to lock a restored Firebase session', error);
            sessionLockRequested = false;
            setUser(currentUser);
            setAuthError('The saved session could not be securely locked. Sign out and try again.');
            setLoading(false);
          });
          return;
        }
      }

      sessionLockRequested = false;
      if (currentUser) setLoading(true);
      unsubscribeProfile?.();
      unsubscribeRole?.();
      unsubscribeProfile = undefined;
      unsubscribeRole = undefined;
      accessRevocationRequested = false;
      setUser(currentUser);
      setProfile(null);
      setIsAdmin(false);
      setApprovalStatus('unregistered');
      setApprovalStatusVerified(false);
      setAuthError(null);
      setBiometricEnabled(false);
      setBiometricStatusError(null);
      setBiometricStatusLoading(Boolean(currentUser));

      if (!currentUser) {
        setBiometricStatusLoading(false);
        setLoading(false);
        return;
      }

      void getBiometricEnrollmentStatus()
        .then((enabled) => {
          if (auth.currentUser?.uid === currentUser.uid) setBiometricEnabled(enabled);
        })
        .catch((error: unknown) => {
          console.error('Failed to check biometric enrollment status', error);
          if (auth.currentUser?.uid === currentUser.uid) {
            setBiometricStatusError('Biometric settings could not be checked. Check your connection and try again.');
          }
        })
        .finally(() => {
          if (auth.currentUser?.uid === currentUser.uid) setBiometricStatusLoading(false);
        });

      let profileLoaded = false;
      let roleLoaded = false;
      const finishLoading = () => {
        if (profileLoaded && roleLoaded) setLoading(false);
      };

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (profileSnapshot) => {
          const data = profileSnapshot.data() || {};
          const status: ApprovalStatus = !profileSnapshot.exists()
            ? 'unregistered'
            : data?.approvalStatus === 'pending' || data?.approvalStatus === 'rejected'
              ? data.approvalStatus
              : 'approved';

          setApprovalStatus(status);
          if (!profileSnapshot.metadata.fromCache) setApprovalStatusVerified(true);
          setProfile(profileSnapshot.exists()
            ? {
                businessName: typeof data.businessName === 'string' ? data.businessName : '',
                email: typeof data.email === 'string' ? data.email : undefined,
                role: data.role === 'admin' ? 'admin' : 'user',
                approvalStatus: status,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              }
            : null);
          profileLoaded = true;
          finishLoading();

          if (
            !profileSnapshot.metadata.fromCache
            && (status === 'pending' || status === 'rejected')
            && !accessRevocationRequested
          ) {
            accessRevocationRequested = true;
            setAuthNotice(status === 'pending'
              ? 'Your registration is pending administrator approval.'
              : 'Your registration request was not approved. You cannot access the system.');
            void signOut(auth).catch((error) => {
              console.error('Failed to sign out an unapproved account', error);
              setAuthError('Your account is not approved and could not be signed out. Please close this page and contact an administrator.');
            });
          }
        },
        (error) => {
          console.error('Failed to load business profile', error);
          setAuthError('Your business profile could not be loaded. Check your connection and Firestore rules.');
          profileLoaded = true;
          finishLoading();
        }
      );

      unsubscribeRole = onSnapshot(
        doc(db, 'userRoles', currentUser.uid),
        (roleSnapshot) => {
          setIsAdmin(roleSnapshot.data()?.role === 'admin');
          roleLoaded = true;
          finishLoading();
        },
        (error) => {
          console.error('Failed to load account role', error);
          setAuthError('Your account access could not be loaded. Check your connection and Firestore rules.');
          roleLoaded = true;
          finishLoading();
        }
      );
    }, (error) => {
      console.error('Failed to initialize Firebase Authentication', error);
      setAuthError('Authentication could not be initialized. Please refresh and try again.');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
      unsubscribeRole?.();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', lockSession);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthNotice(null);
    try {
      setSessionSetupPending(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      try {
        const activatedCredentials = await activateBiometricSignIn();
        if (activatedCredentials > 0) {
          setBiometricEnabled(true);
          setBiometricStatusError(null);
        }
      } catch (error) {
        console.error('Password sign-in succeeded but passkeys could not be reactivated', error);
        setBiometricStatusError('Password sign-in succeeded, but biometric unlock could not be reactivated. Check your connection.');
      }
    } finally {
      setSessionSetupPending(false);
    }
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    setAuthNotice(null);
    const customToken = await authenticateBiometricCredential();
    await signInWithCustomToken(auth, customToken);
  }, []);

  const confirmBiometricSetup = useCallback(async (password: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) throw new Error('Sign in with an email and password before enabling biometrics.');
    await reauthenticateWithCredential(
      currentUser,
      EmailAuthProvider.credential(currentUser.email, password)
    );
    await currentUser.getIdToken(true);
  }, []);

  const enableBiometrics = useCallback(async () => {
    await registerBiometricCredential();
    setBiometricEnabled(true);
    setBiometricStatusError(null);
  }, []);

  const disableBiometrics = useCallback(async () => {
    await revokeBiometricCredentials();
    setBiometricEnabled(false);
    setBiometricStatusError(null);
  }, []);

  const refreshBiometricStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Sign in before checking biometric settings.');
    setBiometricStatusLoading(true);
    try {
      const enabled = await getBiometricEnrollmentStatus();
      if (auth.currentUser?.uid === currentUser.uid) {
        setBiometricEnabled(enabled);
        setBiometricStatusError(null);
      }
    } catch (error) {
      setBiometricStatusError('Biometric settings could not be checked. Check your connection and try again.');
      throw error;
    } finally {
      setBiometricStatusLoading(false);
    }
  }, []);

  const registerAccount = useCallback(async (email: string, password: string) => {
    setAuthNotice(null);
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const timestamp = serverTimestamp();

    try {
      await setDoc(doc(db, 'users', credential.user.uid), {
        businessName: '',
        email: credential.user.email,
        role: 'user',
        approvalStatus: 'pending',
        submittedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    } catch (error) {
      console.error('Failed to save registration request', error);
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Failed to sign out after registration could not be saved', signOutError);
        setAuthError('Your registration request could not be saved, and this account could not be signed out. Contact an administrator.');
      }
      throw new Error('Your account was created, but the registration request could not be saved. Please contact an administrator.');
    }

    setAuthNotice('Your registration request was submitted. You can sign in after an administrator approves it.');
  }, []);

  const logout = useCallback(async () => {
    setAuthNotice(null);
    try {
      if (biometricEnabled || biometricStatusLoading || biometricStatusError) {
        await deactivateBiometricSignIn();
      }
      await signOut(auth);
    } catch (error) {
      console.error('Failed to deactivate biometrics or sign out', error);
      setAuthError('Biometric sign-in could not be safely deactivated or the session could not be closed. You are still signed in; check your connection and try again.');
      throw error;
    }
  }, [biometricEnabled, biometricStatusError, biometricStatusLoading]);

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const saveBusinessName = useCallback(async (businessName: string) => {
    const currentUser = auth.currentUser;
    const normalizedName = businessName.trim();
    if (!currentUser) throw new Error('You must be signed in to save a business name.');
    if (!normalizedName) throw new Error('Enter your Business Name to continue.');

    const profileRef = doc(db, 'users', currentUser.uid);
    const existingProfile = await getDoc(profileRef);
    if (existingProfile.exists()) {
      await updateDoc(profileRef, {
        businessName: normalizedName,
        updatedAt: serverTimestamp()
      });
    } else if (isAdmin) {
      const timestamp = serverTimestamp();
      await setDoc(profileRef, {
        businessName: normalizedName,
        email: currentUser.email || '',
        role: 'admin',
        approvalStatus: 'approved',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    } else {
      throw new Error('A registration request must be approved before creating a business profile.');
    }

    setProfile((currentProfile) => ({
      businessName: normalizedName,
      email: currentProfile?.email || currentUser.email || undefined,
      role: currentProfile?.role || (isAdmin ? 'admin' : 'user'),
      approvalStatus: 'approved',
      createdAt: currentProfile?.createdAt,
      updatedAt: currentProfile?.updatedAt
    }));
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      approvalStatus,
      approvalStatusVerified,
      loading,
      authError,
      authNotice,
      biometricEnabled,
      biometricStatusLoading,
      biometricStatusError,
      signIn,
      registerAccount,
      unlockWithBiometrics,
      confirmBiometricSetup,
      enableBiometrics,
      disableBiometrics,
      refreshBiometricStatus,
      logout,
      clearAuthNotice,
      saveBusinessName
    }}>
      {loading || sessionSetupPending ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
