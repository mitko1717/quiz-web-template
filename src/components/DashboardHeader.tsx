"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/providers/I18nProvider";
import type { DashboardHeaderProps } from "./DashboardHeader.types";

export function DashboardHeader({ dailyStreak, totalInsightPoints = null, onLanguageChange, headerAction }: DashboardHeaderProps) {
  const { t } = useI18n();

  return (
      <header className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-base-600 bg-base-800 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex h-9 items-center rounded-xl border border-accent-greenDim/50 bg-accent-green/10 px-3 text-sm font-semibold text-accent-green">
                {t("header_daily_streak", { days: dailyStreak })}
              </p>
              {typeof totalInsightPoints === "number" ? (
                <p className="inline-flex h-9 items-center rounded-xl border border-base-600 bg-base-700/50 px-3 text-sm font-semibold text-ink-200">
                  {t("stats_points")}: {totalInsightPoints}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {headerAction}
            <LanguageSwitcher trigger="icon" onChange={onLanguageChange} compact />
          </div>
        </div>
      </header>
  );
}
