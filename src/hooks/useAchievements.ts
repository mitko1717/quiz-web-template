"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

export function useAchievementsQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.achievements(token),
    queryFn: () => apiClient.getAchievements(token),
    enabled: Boolean(token),
  });
}