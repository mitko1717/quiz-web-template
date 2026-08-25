import type { ReactNode } from 'react';
import type { Language, TranslationKey } from '@/lib/i18n';

export interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

export type I18nProviderProps = {
  children: ReactNode;
};
