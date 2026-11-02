import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { firebaseConfigured, loadFirebase } from './firebase';

type AuthState = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsubscribe = () => {};
    let active = true;

    loadFirebase()
      .then(async ({ auth }) => {
        const { onAuthStateChanged } = await import('firebase/auth');
        if (!active) return;
        unsubscribe = onAuthStateChanged(auth, (next) => {
          setUser(next);
          setReady(true);
        });
      })
      .catch(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      configured: firebaseConfigured,
      user,
      async signIn() {
        const { auth } = await loadFirebase();
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
      },
      async signOutUser() {
        const { auth } = await loadFirebase();
        const { signOut } = await import('firebase/auth');
        await signOut(auth);
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
