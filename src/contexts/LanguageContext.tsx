import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReactNode } from 'react';
import { en } from '../i18n/en';
import { ko } from '../i18n/ko';
import { ja } from '../i18n/ja';
import { zh } from '../i18n/zh';
import { vi } from '../i18n/vi';
import { th } from '../i18n/th';
import { tl } from '../i18n/tl';
import { id } from '../i18n/id';

const translations: Record<string, Record<string, string>> = {
  en, ko, ja, zh, vi, th, tl, id,
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LANGUAGE_KEY = 'retem_language';

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored) setLanguageState(stored);
      } catch (e) {
        console.error('Error loading language preference:', e);
      }
    })();
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch((e) =>
      console.error('Error saving language preference:', e)
    );
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
