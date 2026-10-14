"use client";

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { type Language, translate } from '@/lib/i18n';
import type { I18nContextValue, I18nProviderProps } from './I18nProvider.types';
import { topicConfig } from '@/lib/topic.config';

// A language outside the app's supported set (e.g. a stored 'en' preference in a uk-only app)
// falls back to the first supported language.
function resolveLanguage(language: Language): Language {
  return topicConfig.languages.includes(language) ? language : topicConfig.languages[0];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => resolveLanguage('en'));
  const setLanguage = useCallback((next: Language) => setLanguageState(resolveLanguage(next)), []);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values) => translate(language, key, values)
  }), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within <I18nProvider />');
  return context;
}
