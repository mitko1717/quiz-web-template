"use client";

import { createContext, useContext, useMemo, useState } from 'react';
import { type Language, translate } from '@/lib/i18n';
import type { I18nContextValue, I18nProviderProps } from './I18nProvider.types';

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values) => translate(language, key, values)
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within <I18nProvider />');
  return context;
}
