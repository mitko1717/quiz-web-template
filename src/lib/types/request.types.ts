import { Language } from '../i18n';
import type { DifficultyLevel } from './types-core';

export interface ProfileResetRequest {
  resetProgress?: boolean;
  resetAttempts?: boolean;
  deleteAccount?: boolean;
}

export interface ProfileLanguageRequest {
  language: Language;
}

export interface ProfileDifficultyRequest {
  difficulty: DifficultyLevel;
}
