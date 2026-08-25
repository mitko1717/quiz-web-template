import { en } from './en';
import { es } from './es';
import { uk } from './uk';

export type Language = 'en' | 'es' | 'uk';
export type TranslationKey = keyof typeof en;

const dictionaries = {
  en,
  es,
  uk
} as const;

export function translate(language: Language, key: TranslationKey, values?: Record<string, string | number>): string {
  const template = dictionaries[language][key] ?? dictionaries.en[key];
  if (!values) return template;

  return template.replace(/\{([^{}]+)\}/g, (_, placeholder: string) => {
    const value = values[placeholder];
    return value === undefined ? `{${placeholder}}` : String(value);
  });
}
