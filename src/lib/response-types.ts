import { AdaptiveDifficultySuggestion, HintType, QuestionDirection, QuizInputMode, type DifficultyLevel, type Language } from './types-core';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResetResponse {
  attemptsDeleted: number;
  progressRowsDeleted: number;
  accountDeleted: boolean;
}

export interface ProfileResponse {
  userId: string;
  role: 'user' | 'admin';
  preferredLanguage: Language;
  preferredDifficultyLevel: DifficultyLevel;
  dailyStreak: number;
  bestDailyStreak: number;
  refCode: string;
  referralLink: string | null;
}

export interface ProfileLanguageResponse {
  preferredLanguage: Language;
}

export interface ProfileDifficultyResponse {
  preferredDifficultyLevel: DifficultyLevel;
}

export interface QuestionResponse {
  countryId: string;
  prompt: string;
  countryName: string;
  flagEmoji: string;
  difficulty: DifficultyLevel;
  inputMode: QuizInputMode;
  questionDirection: QuestionDirection;
  options: string[];
}

export interface AnswerResponse {
  correct: boolean;
  correctAnswer: string | null;
  answerRevealed: boolean;
  canRetry: boolean;
  attemptsRemaining: number;
  wrongSelections: string[];
  insightPointsPenalty: number;
  freeTextBonusInsightPointsAwarded: number;
  updatedStreak: number;
  updatedInsightPoints: number;
  difficultySuggestion: Exclude<AdaptiveDifficultySuggestion, AdaptiveDifficultySuggestion.STAY> | null;
}

export interface SkipResponse {
  skipped: true;
  correctAnswer: string;
  insightPointsPenalty: number;
  updatedStreak: number;
  updatedInsightPoints: number;
}

export type HintResponse =
  | {
      type: HintType.REMOVE_OPTION;
      remainingOptions: string[];
      usedFreeHint: boolean;
      insightPointsSpent: number;
      updatedInsightPoints: number;
    }
  | {
      type: HintType.TEXT_CLUE;
      clue: string;
      usedFreeHint: boolean;
      insightPointsSpent: number;
      updatedInsightPoints: number;
    };

export interface ProgressResponse {
  difficultyLevel: DifficultyLevel;
  currentStreak: number;
  bestStreak: number;
  insightPoints: number;
  lastFreeHintUsedAt: string | null;
  updatedAt: string;
}

export interface UserAnswerStatsByDifficulty {
  difficultyLevel: DifficultyLevel;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  skipCount: number;
  hintsUsedCount: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  insightPoints: number;
}

export interface DifficultyUnlockStatus {
  difficultyLevel: DifficultyLevel;
  unlocked: boolean;
  correctAnswersTowardsUnlock: number;
  requiredCorrectAnswers: number;
  progress: number;
}

export interface DifficultyProgressionResponse {
  highestUnlockedDifficulty: DifficultyLevel;
  nextDifficultyToUnlock: DifficultyLevel | null;
  requiredCorrectAnswersPerLevel: Record<string, number>;
  levels: DifficultyUnlockStatus[];
}

export interface UserAnswerStatsResponse {
  totalInsightPoints: number;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  skipCount: number;
  hintsUsedCount: number;
  accuracy: number;
  bestStreakOverall: number;
  progression: DifficultyProgressionResponse;
  byDifficulty: UserAnswerStatsByDifficulty[];
}

export interface AdminQuizConfigResponse {
  noRepeatWindow: number;
  repeatWindowPoolFraction: number;
  mistakeWeightBoostMultiplier: number;
  freeTextMaxTypoDistance: number;
  freeTextMaxAttempts: number;
  freeTextBonusInsightPoints: number;
  dailyChallengeQuestionCount: number;
  unlockThresholds: Record<string, number>;
  dailyStreakMilestoneBonuses: Record<string, number>;
  insightPointRewardsByDifficulty: Record<DifficultyLevel, number>;
  maxAttemptsByDifficulty: Record<DifficultyLevel, number>;
  wrongPenaltyByDifficulty: Record<DifficultyLevel, number>;
  skipPenaltyByDifficulty: Record<DifficultyLevel, number>;
  targetPopularityWeights: Record<DifficultyLevel, Record<string, number>>;
  distractorPopularityMatrix: Record<DifficultyLevel, string[]>;
  expert: {
    expertNoneOfAboveProbability: number;
    expertTrapHistoryProbability: number;
    expertSameCountryAllOptionsProbability: number;
  };
}

export interface AdminRangeNumberSpecResponse {
  min: number;
  max: number;
  step?: number;
}

export interface AdminGameplayConfigSchemaResponse {
  noRepeatWindow: AdminRangeNumberSpecResponse;
  repeatWindowPoolFraction: AdminRangeNumberSpecResponse;
  mistakeWeightBoostMultiplier: AdminRangeNumberSpecResponse;
  freeTextMaxTypoDistance: AdminRangeNumberSpecResponse;
  freeTextMaxAttempts: AdminRangeNumberSpecResponse;
  freeTextBonusInsightPoints: AdminRangeNumberSpecResponse;
  dailyChallengeQuestionCount: AdminRangeNumberSpecResponse;
  unlockThresholdValue: AdminRangeNumberSpecResponse;
  dailyStreakMilestoneBonusValue: AdminRangeNumberSpecResponse;
  maxAttemptsByDifficultyValue: AdminRangeNumberSpecResponse;
  insightPointRewardsByDifficultyValue: AdminRangeNumberSpecResponse;
  wrongPenaltyByDifficultyValue: AdminRangeNumberSpecResponse;
  skipPenaltyByDifficultyValue: AdminRangeNumberSpecResponse;
  targetPopularityWeightValue: AdminRangeNumberSpecResponse;
  distractorPopularityItemCount: AdminRangeNumberSpecResponse;
  expertProbabilityValue: AdminRangeNumberSpecResponse;
  allowedPopularityValues: string[];
  difficultyLevels: DifficultyLevel[];
  unlockDifficultyKeys: Array<'2' | '3' | '4' | '5'>;
  dailyStreakMilestoneKeys: Array<'7' | '30'>;
}

export interface AdminUserDifficultyStatsResponse {
  difficultyLevel: DifficultyLevel;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  skipCount: number;
  hintsUsedCount: number;
  accuracy: number;
}

export interface AdminUserStatsSummaryResponse {
  userId: string;
  displayName: string | null;
  email: string | null;
  deviceId: string | null;
  tgUsername: string | null;
  tgDisplayName: string | null;
  createdAt: string;
  lastSeenAt: string;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  skipCount: number;
  hintsUsedCount: number;
  accuracy: number;
  insightPointsTotal: number;
  bestStreakOverall: number;
}

export interface AdminUsersStatsResponse {
  totalUsers: number;
  limit: number;
  offset: number;
  items: AdminUserStatsSummaryResponse[];
}

export interface AdminUserStatsDetailsResponse {
  summary: AdminUserStatsSummaryResponse;
  byDifficulty: AdminUserDifficultyStatsResponse[];
  progressRows: Array<{
    difficultyLevel: DifficultyLevel;
    currentStreak: number;
    bestStreak: number;
    insightPoints: number;
    lastFreeHintUsedAt: string | null;
    updatedAt: string;
  }>;
}

export interface DailyChallengeQuestionResponse {
  index: number;
  countryId: string;
  countryName: string;
  difficulty: DifficultyLevel;
  options: string[];
}

export interface DailyChallengeStateResponse {
  challengeDate: string;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  completed: boolean;
  completedAt: string | null;
  questions: DailyChallengeQuestionResponse[];
  currentQuestionIndex: number | null;
  currentQuestion: DailyChallengeQuestionResponse | null;
}

export interface DailyChallengeAnswerResponse {
  challengeDate: string;
  correct: boolean;
  correctAnswer: string;
  answeredCount: number;
  correctCount: number;
  remainingQuestions: number;
  completed: boolean;
  completedAt: string | null;
}
