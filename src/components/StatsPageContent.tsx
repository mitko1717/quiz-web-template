"use client";

import { useAuthContext } from "@/components/AuthGate";
import { DashboardHeader } from "@/components/DashboardHeader";
import { UserStatsPanel } from "@/components/UserStatsPanel";
import { useStatsPageState } from "@/hooks/useStatsPageState";

export function StatsPageContent() {
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const statsPage = useStatsPageState(token);

  return (
    <section className="w-full space-y-4 sm:space-y-5">
      <DashboardHeader
        authMode={authMode}
        username={username}
        dailyStreak={statsPage.profile?.dailyStreak ?? 0}
        totalInsightPoints={statsPage.stats?.totalInsightPoints ?? null}
        onLanguageChange={setPreferredLanguage}
      />

      <UserStatsPanel
        stats={statsPage.stats}
        globalStats={statsPage.globalStats}
        achievements={statsPage.achievements}
        loading={statsPage.loading}
        error={statsPage.error}
        offline={statsPage.offline}
        activeDifficulty={statsPage.activeDifficulty}
        refreshing={statsPage.refreshing}
        onRefresh={() => void statsPage.refresh()}
      />
    </section>
  );
}