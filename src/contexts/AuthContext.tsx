import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string, fullName: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
          } else {
            // User exists in Auth but not in Firestore — create profile
            const newUser: Omit<User, 'id'> = {
              email: firebaseUser.email ?? '',
              passwordHash: '',
              fullName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? '',
              profileImage: firebaseUser.photoURL ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.email ?? '')}`,
              language: 'en',
              location: '',
              verified: false,
              verificationStatus: 'none',
              trustScore: 0,
              authProvider: 'email',
              isActive: true,
              lastLoginAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser({ id: firebaseUser.uid, ...newUser });
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error restoring auth state:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.id));
    if (userDoc.exists()) {
      setUser({ id: userDoc.id, ...userDoc.data() } as User);
    }
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user
      return null;
    } catch (error: any) {
      console.error('Login error:', error.code);
      return 'error.login_failed';
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<string | null> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Create user profile in Firestore
      const newUser: Omit<User, 'id'> = {
        email,
        passwordHash: '',
        fullName,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        language: 'en',
        location: '',
        verified: false,
        verificationStatus: 'none',
        trustScore: 0,
        authProvider: 'email',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      setUser({ id: firebaseUser.uid, ...newUser });
      return null;
    } catch (error: any) {
      console.error('Signup error:', error.code);
      if (error.code === 'auth/email-already-in-use') {
        return 'error.email_exists';
      }
      return 'error.login_failed';
    }
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    // Google sign-in requires expo-auth-session setup
    // Will be implemented with Google OAuth flow
    console.warn('Google sign-in is not yet implemented for React Native.');
    return 'error.login_failed';
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return null; // success
    } catch (error: any) {
      console.error('Password reset error:', error.code);
      if (error.code === 'auth/user-not-found') {
        return 'error.user_not_found';
      }
      if (error.code === 'auth/invalid-email') {
        return 'error.invalid_email';
      }
      return 'error.reset_failed';
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, signup, loginWithGoogle, resetPassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
