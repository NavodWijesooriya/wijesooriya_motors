'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { LoadingScreen } from '../src/components/LoadingScreen';

const AuthContext = createContext<{ user: User | null; isAdmin: boolean }>({ user: null, isAdmin: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(false);
      if (!currentUser) setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'userRoles', user.uid),
      (roleSnapshot) => {
        setIsAdmin(roleSnapshot.data()?.role === 'admin');
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load account role', error);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <AuthContext.Provider value={{ user, isAdmin }}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);