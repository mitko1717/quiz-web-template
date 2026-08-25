"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { Language } from '@/lib/i18n';
import type { DifficultyLevel } from '@/lib/types';

export function useProfileQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.profile(token),
    queryFn: () => apiClient.getProfile(token),
    enabled: Boolean(token),
  });
}

export function useUpdateProfileLanguageMutation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: Language) => apiClient.updateProfileLanguage({ language }, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateProfileDifficultyMutation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (difficulty: DifficultyLevel) => apiClient.updateProfileDifficulty({ difficulty }, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useResetProfileMutation(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { resetProgress?: boolean; resetAttempts?: boolean; deleteAccount?: boolean }) => apiClient.resetProfile(payload, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['progress'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-challenge'] }),
      ]);
    },
  });
}
