'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LoadingScreen } from '../src/components/LoadingScreen';

export interface UserProfile {
  businessName: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  saveBusinessName: (businessName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  authError: null,
  saveBusinessName: async () => {
    throw new Error('Authentication is required to save a business name.');
  }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeRole: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setLoading(true);
      unsubscribeProfile?.();
      unsubscribeRole?.();
      unsubscribeProfile = undefined;
      unsubscribeRole = undefined;
      setUser(currentUser);
      setProfile(null);
      setIsAdmin(false);
      setAuthError(null);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      let profileLoaded = false;
      let roleLoaded = false;
      const finishLoading = () => {
        if (profileLoaded && roleLoaded) setLoading(false);
      };

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', currentUser.uid),
        (profileSnapshot) => {
          const data = profileSnapshot.data();
          setProfile(profileSnapshot.exists() && typeof data?.businessName === 'string'
            ? {
                businessName: data.businessName,
                email: typeof data.email === 'string' ? data.email : undefined,
                role: data.role === 'admin' ? 'admin' : 'user',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              }
            : null);
          profileLoaded = true;
          finishLoading();
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
    };
  }, []);

  const saveBusinessName = useCallback(async (businessName: string) => {
    const currentUser = auth.currentUser;
    const normalizedName = businessName.trim();
    if (!currentUser) throw new Error('You must be signed in to save a business name.');
    if (!normalizedName) throw new Error('Enter your Business Name to continue.');

    const profileRef = doc(db, 'users', currentUser.uid);
    const nextProfile = {
      businessName: normalizedName,
      email: currentUser.email || '',
      role: isAdmin ? 'admin' as const : 'user' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const existingProfile = await getDoc(profileRef);
    if (existingProfile.exists()) {
      await updateDoc(profileRef, {
        businessName: normalizedName,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(profileRef, nextProfile);
    }
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, authError, saveBusinessName }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
