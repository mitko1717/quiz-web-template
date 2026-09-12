import type { ReactNode } from 'react';
import type { AuthMode } from '@/lib/types';
import type { Language } from '@/lib/i18n';

export interface DashboardHeaderProps {
  authMode: AuthMode;
  username: string | null;
  dailyStreak: number;
  totalInsightPoints?: number | null;
  onLanguageChange?: (language: Language) => Promise<void> | void;
  headerAction?: ReactNode;
}

export type IconButtonProps = {
  href: string;
  label: string;
  children: ReactNode;
};
