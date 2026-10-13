"use client";

import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/components/I18nProvider";
import { FlameIcon, StarIcon } from "@/components/icons";
import type { DashboardHeaderProps } from "./types/DashboardHeader.types";

type StatCardProps = {
  icon: ReactNode;
  iconToneClassName: string;
  label: string;
  value: ReactNode;
};

function StatCard({ icon, iconToneClassName, label, value }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl bg-base-800/80 px-3 py-2 ring-1 ring-inset ring-base-600/50">
      <span className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconToneClassName].join(" ")}>{icon}</span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11px] font-medium text-ink-500">{label}</p>
        <p className="truncate text-base font-bold tabular-nums text-ink-100">{value}</p>
      </div>
    </div>
  );
}

export function DashboardHeader({ dailyStreak, totalInsightPoints = null, onLanguageChange, headerAction }: DashboardHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="flex w-full min-w-0 items-stretch gap-2">
      {typeof totalInsightPoints === "number" ? (
        <StatCard
          icon={<StarIcon className="h-5 w-5" />}
          iconToneClassName="bg-pastel-amber/15 text-pastel-amber shadow-[0_0_14px_color-mix(in_srgb,var(--color-pastel-amber)_30%,transparent)]"
          label={t("stats_points")}
          value={totalInsightPoints}
        />
      ) : null}
      <StatCard
        icon={<FlameIcon className="h-5 w-5" />}
        iconToneClassName="bg-pastel-coral/15 text-pastel-coral shadow-[0_0_14px_color-mix(in_srgb,var(--color-pastel-coral)_30%,transparent)]"
        label={t("header_streak_label")}
        value={t("header_streak_days", { days: dailyStreak })}
      />
      <div className="flex shrink-0 items-center gap-2">
        {headerAction}
        <LanguageSwitcher trigger="icon" onChange={onLanguageChange} compact />
      </div>
    </header>
  );
}
