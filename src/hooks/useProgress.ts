"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { DifficultyLevel } from '@/lib/types';

export function useAllProgressQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.allProgress(token),
    queryFn: () => apiClient.getAllProgress(token),
    enabled: Boolean(token),
  });
}

export function useProgressForLevelQuery(token: string, difficulty: DifficultyLevel) {
  return useQuery({
    queryKey: queryKeys.progressByDifficulty(token, difficulty),
    queryFn: () => apiClient.getProgressForLevel(difficulty, token),
    enabled: Boolean(token),
  });
}

export function useAnswerStatsQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.progressStats(token),
    queryFn: () => apiClient.getAnswerStats(token),
    enabled: Boolean(token),
  });
}
