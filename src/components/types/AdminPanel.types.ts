import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type {
  AdminGameplayConfigSchemaResponse,
  AdminQuizConfigResponse,
  AdminUserDifficultyStatsResponse,
  AdminUserStatsDetailsResponse,
  AdminUsersStatsResponse,
  AuthMode,
  DifficultyLevel
} from '@/lib/types';

export type SurfaceProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: string;
};

export type UserListPanelProps = {
  users: AdminUsersStatsResponse | null;
  selectedUser: AdminUserStatsDetailsResponse | null;
  search: string;
  setSearch: (v: string) => void;
  loadingUsers: boolean;
  usersError: string | null;
  offset: number;
  pageSize: number;
  onSelectUser: (id: string) => void;
  onReload: () => void;
  onPageChange: (page: number) => void;
};

export type UserDetailPanelProps = {
  selectedUser: AdminUserStatsDetailsResponse | null;
  loading: boolean;
  error: string | null;
};

export type DifficultyNumberEditorProps = {
  label: string;
  values: Record<DifficultyLevel, number>;
  min: number;
  onChange: (level: DifficultyLevel, value: number) => void;
};

export type ProbabilityEditorProps = {
  label: string;
  field: string;
  value: number;
  onChange: (field: string, value: number) => void;
} & Omit<ComponentPropsWithoutRef<'input'>, 'value' | 'onChange'>;

export type QuizConfigEditorProps = {
  config: AdminQuizConfigResponse;
  schema?: AdminGameplayConfigSchemaResponse | null;
  saving: boolean;
  error: string | null;
  onSave: (patch: Partial<AdminQuizConfigResponse>) => void;
  onReset: () => void;
};

export type AdminPanelProps = {
  token: string;
  authMode: AuthMode;
  canAccess?: boolean;
  pageSize?: number;
};

export type DifficultyRow = AdminUserDifficultyStatsResponse;
