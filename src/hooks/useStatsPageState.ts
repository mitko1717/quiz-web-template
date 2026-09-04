"use client";

import { useCallback, useState } from "react";
import { useAchievementsQuery } from "@/hooks/useAchievements";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useGlobalStatsQuery, useProfileQuery } from "@/hooks/useProfile";
import { useAnswerStatsQuery } from "@/hooks/useProgress";
import type { DifficultyLevel } from "@/lib/types";

export function useStatsPageState(token: string) {
  const { isOnline } = useNetworkStatus();
  const profileQuery = useProfileQuery(token);
  const statsQuery = useAnswerStatsQuery(token);
  const globalStatsQuery = useGlobalStatsQuery(token);
  const achievementsQuery = useAchievementsQuery(token);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        profileQuery.refetch(),
        statsQuery.refetch(),
        globalStatsQuery.refetch(),
        achievementsQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [achievementsQuery, globalStatsQuery, profileQuery, statsQuery]);

  const stats = statsQuery.data ?? null;
  const loading = statsQuery.isLoading || statsQuery.isFetching;
  const showOfflineFallback = !isOnline && !stats && (loading || Boolean(statsQuery.error));

  return {
    profile: profileQuery.data ?? null,
    stats,
    globalStats: globalStatsQuery.data ?? null,
    achievements: achievementsQuery.data ?? null,
    loading,
    error: showOfflineFallback ? null : statsQuery.error instanceof Error ? statsQuery.error.message : null,
    offline: showOfflineFallback,
    activeDifficulty: (profileQuery.data?.preferredDifficultyLevel ?? 1) as DifficultyLevel,
    refreshing,
    refresh,
  };
}
