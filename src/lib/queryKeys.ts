import type { DifficultyLevel, QuestionDirection, QuizScope, QuizInputMode } from '@/lib/types';

export const queryKeys = {
  profile: (token: string) => ['profile', token] as const,
  globalStats: (token: string) => ['profile', token, 'global-stats'] as const,
  achievements: (token: string) => ['achievements', token] as const,
  progressRoot: (token: string) => ['progress', token] as const,
  allProgress: (token: string) => ['progress', token, 'all'] as const,
  progressByDifficulty: (token: string, difficulty: DifficultyLevel) => ['progress', token, 'difficulty', difficulty] as const,
  progressStats: (token: string) => ['progress', token, 'stats'] as const,
  quizSession: (token: string) => ['quiz', token, 'session'] as const,
  quizCard: (token: string, difficulty: DifficultyLevel, mode: QuizInputMode, direction: QuestionDirection, scope: QuizScope) =>
    ['quiz', token, 'card', difficulty, mode, direction, scope] as const,
  dailyChallenge: (token: string) => ['daily-challenge', token] as const,
  adminUsers: (token: string, limit: number, offset: number, search: string) => ['admin', token, 'users', limit, offset, search] as const,
  adminUserDetails: (token: string, userId: string) => ['admin', token, 'users', userId] as const,
  adminQuizConfig: (token: string) => ['admin', token, 'quiz-config'] as const,
  adminGameplayConfig: (token: string) => ['admin', token, 'gameplay-config'] as const,
  adminGameplayConfigSchema: (token: string) => ['admin', token, 'gameplay-config-schema'] as const,
};