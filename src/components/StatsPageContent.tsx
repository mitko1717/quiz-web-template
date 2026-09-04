"use client";

import { useCallback, useState } from "react";
import { useAuthContext } from "@/components/AuthGate";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UserStatsPanel } from "@/components/UserStatsPanel";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useGlobalStatsQuery, useProfileQuery } from "@/hooks/useProfile";
import { useAnswerStatsQuery } from "@/hooks/useProgress";
import type { DifficultyLevel } from "@/lib/types";

export function StatsPageContent() {
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const { isOnline } = useNetworkStatus();
  const profileQuery = useProfileQuery(token);
  const statsQuery = useAnswerStatsQuery(token);
  const globalStatsQuery = useGlobalStatsQuery(token);
  const [refreshing, setRefreshing] = useState(false);
  const loading = statsQuery.isLoading || statsQuery.isFetching;
  const stats = statsQuery.data ?? null;
  const globalStats = globalStatsQuery.data ?? null;
  const showOfflineFallback = !isOnline && !stats && (loading || Boolean(statsQuery.error));
  const error = showOfflineFallback ? null : (statsQuery.error instanceof Error ? statsQuery.error.message : null);
  const activeDifficulty = (profileQuery.data?.preferredDifficultyLevel ?? 1) as DifficultyLevel;

  const refreshStatsPage = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([profileQuery.refetch(), statsQuery.refetch(), globalStatsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [profileQuery, statsQuery, globalStatsQuery]);

  return (
    <section className="w-full space-y-4 sm:space-y-5">
      <DashboardHeader
        authMode={authMode}
        username={username}
        dailyStreak={profileQuery.data?.dailyStreak ?? 0}
        totalInsightPoints={stats?.totalInsightPoints ?? null}
        onLanguageChange={setPreferredLanguage}
      />

      <UserStatsPanel
        stats={stats}
        globalStats={globalStats}
        loading={loading}
        error={error}
        offline={showOfflineFallback}
        activeDifficulty={activeDifficulty}
        refreshing={refreshing}
        onRefresh={() => void refreshStatsPage()}
      />
    </section>
  );
}