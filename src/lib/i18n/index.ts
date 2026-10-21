/* eslint-disable @typescript-eslint/no-explicit-any */
import { ar } from './messages/ar';
import { en } from './messages/en';
import { Direction, Locale, Translations } from './types';

export const LOCALE_COOKIE_NAME = 'radd_locale';
export const DEFAULT_LOCALE: Locale = 'ar';

export const dictionaries: Record<Locale, Translations> = {
  ar,
  en,
};

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

export function getDirection(locale: Locale): Direction {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

/**
 * Nested key path type helper for translations (e.g. "common.appName" or "reviews.draftReply")
 */
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;

export type TranslationKey = Join<PathsToStringProps<Translations>, '.'>;

/**
 * Universal translation function. Works on both Server and Client.
 * e.g. t('common.save', 'ar') -> 'حفظ'
 */
export function t(key: TranslationKey | string, locale: Locale = DEFAULT_LOCALE): string {
  const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  const parts = key.split('.');
  
  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key; // fallback to key itself if not found
    }
  }

  return typeof current === 'string' ? current : key;
}

export * from './types';
