import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string, fullName: string) => Promise<string | null>;
  loginWithGoogle: () => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'retem_users';
const CURRENT_USER_KEY = 'retem_current_user_id';

async function simpleHash(str: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    str
  );
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem(CURRENT_USER_KEY);
        if (storedId) {
          const users = await getUsers();
          const found = users.find((u: User) => u.id === storedId);
          if (found) setUser(found);
        }
      } catch (e) {
        console.error('Error restoring auth state:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    const users = await getUsers();
    const found = users.find((u: User) => u.id === user.id);
    if (found) setUser(found);
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    const users = await getUsers();
    const found = users.find((u: User) => u.email === email);

    if (!found) return 'error.login_failed';

    const hash = await simpleHash(password);
    if (found.passwordHash !== hash && found.passwordHash !== 'local_mock') {
      return 'error.login_failed';
    }

    // Migrate legacy accounts that have 'local_mock' as password hash
    if (found.passwordHash === 'local_mock') {
      found.passwordHash = hash;
      await saveUsers(users);
    }

    setUser(found);
    await AsyncStorage.setItem(CURRENT_USER_KEY, found.id);
    return null;
  };

  const signup = async (email: string, password: string, fullName: string): Promise<string | null> => {
    const users = await getUsers();
    if (users.find((u: User) => u.email === email)) return 'error.email_exists';

    const newUser: User = {
      id: generateUUID(),
      email,
      passwordHash: await simpleHash(password),
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

    users.push(newUser);
    await saveUsers(users);
    await AsyncStorage.setItem(CURRENT_USER_KEY, newUser.id);
    setUser(newUser);
    return null;
  };

  const loginWithGoogle = async (): Promise<string | null> => {
    // Google sign-in is not yet implemented for React Native.
    // This would require expo-auth-session or @react-native-google-signin/google-signin.
    // For now, return an error message.
    console.warn('Google sign-in is not yet implemented for React Native.');
    return 'error.login_failed';
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, signup, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
