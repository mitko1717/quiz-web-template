import type { ReactNode } from 'react';
import type { AchievementProgressResponse, DifficultyLevel, GlobalStatsResponse, UserAnswerStatsResponse } from '@/lib/types';

export interface UserStatsPanelProps {
  stats: UserAnswerStatsResponse | null;
  globalStats?: GlobalStatsResponse | null;
  achievements?: AchievementProgressResponse[] | null;
  loading: boolean;
  error: string | null;
  offline?: boolean;
  activeDifficulty: DifficultyLevel;
  refreshing: boolean;
  onRefresh: () => void;
}

export type PanelShellProps = {
  children: ReactNode;
  variant?: 'default' | 'error';
};

export type ErrorStateProps = {
  error: string;
};

export type ProgressBarProps = {
  progress: number;
  tone?: 'accent' | 'muted';
};

export type SummaryMetricCardProps = {
  label: string;
  value: number;
  valueClassName: string;
};

export type HeroPanelProps = {
  stats: UserAnswerStatsResponse;
  refreshing: boolean;
  onRefresh: () => void;
};

export type SummaryGridProps = {
  stats: UserAnswerStatsResponse;
};

export type ActiveDifficultyPanelProps = {
  activeLevel: UserAnswerStatsResponse['byDifficulty'][number];
};

export type StatPairProps = {
  label: string;
  value: number | string;
};

export type DifficultyStatsTableProps = {
  stats: UserAnswerStatsResponse;
  activeDifficulty: DifficultyLevel;
  onOpenDetails: (difficultyLevel: DifficultyLevel) => void;
};

export type UnlockLevelCardProps = {
  level: UserAnswerStatsResponse['progression']['levels'][number];
};

export type UnlockLevelsGridProps = {
  stats: UserAnswerStatsResponse;
};

export type GlobalStatsPanelProps = {
  stats: GlobalStatsResponse;
};