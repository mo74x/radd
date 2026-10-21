/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, getDirection, isRtl, LOCALE_COOKIE_NAME, t as translate, TranslationKey } from './index';
import { Direction, Locale } from './types';

interface I18nContextValue {
  locale: Locale;
  direction: Direction;
  isRtl: boolean;
  setLocale: (newLocale: Locale) => void;
  t: (key: TranslationKey | string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Check cookie on client mount if available
    const match = document.cookie.match(new RegExp(`(^| )${LOCALE_COOKIE_NAME}=([^;]+)`));
    if (match && (match[2] === 'ar' || match[2] === 'en')) {
      const savedLocale = match[2] as Locale;
      if (savedLocale !== locale) {
        setLocaleState(savedLocale);
        document.documentElement.lang = savedLocale;
        document.documentElement.dir = getDirection(savedLocale);
      }
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist in cookie (1 year expiry)
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Update document properties dynamically
    document.documentElement.lang = newLocale;
    document.documentElement.dir = getDirection(newLocale);
  };

  const direction = getDirection(locale);
  const rtl = isRtl(locale);

  const t = (key: TranslationKey | string) => translate(key, locale);

  return (
    <I18nContext.Provider
      value={{
        locale,
        direction,
        isRtl: rtl,
        setLocale,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside of provider
    return {
      locale: DEFAULT_LOCALE,
      direction: 'rtl',
      isRtl: true,
      setLocale: () => {},
      t: (key: string) => translate(key, DEFAULT_LOCALE),
    };
  }
  return context;
}
