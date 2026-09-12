import type { ReactNode } from 'react';
import type { AuthMode } from '@/lib/types';
import type { Language } from '@/lib/i18n';

export interface AuthContextValue {
  token: string;
  authMode: AuthMode;
  username: string | null;
  setPreferredLanguage: (language: Language) => Promise<void>;
  linkWithGoogle: (idToken: string) => Promise<void>;
  linkWithApple: (identityToken: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

export type AuthGateProps = {
  children: ReactNode;
  adminOnly?: boolean;
};
