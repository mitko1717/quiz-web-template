"use client";

import { LightbulbIcon } from "@/components/icons";
import { useI18n } from "@/components/I18nProvider";
import type { ProgressResponse } from "@/lib";

type HintButtonProps = {
  hintCost: number;
  hasUsedHintThisQuestion: boolean;
  progress: ProgressResponse | null;
  totalInsightPoints: number | null;
  loadingProgress: boolean;
  disabled: boolean;
  pending: boolean;
  onUseHint: () => Promise<void>;
};

function isSameUtcDay(first: Date, second: Date): boolean {
  return (
    first.getUTCFullYear() === second.getUTCFullYear() &&
    first.getUTCMonth() === second.getUTCMonth() &&
    first.getUTCDate() === second.getUTCDate()
  );
}

function hasFreeHintAvailable(lastFreeHintUsedAt: string | null | undefined): boolean {
  if (!lastFreeHintUsedAt) return true;
  const lastUsed = new Date(lastFreeHintUsedAt);
  if (Number.isNaN(lastUsed.getTime())) return false;
  return !isSameUtcDay(lastUsed, new Date());
}

export function HintButton({ hintCost, hasUsedHintThisQuestion, progress, totalInsightPoints, loadingProgress, disabled, pending, onUseHint }: HintButtonProps) {
  const { t } = useI18n();
  const freeHintAvailable = progress ? hasFreeHintAvailable(progress.lastFreeHintUsedAt) : false;
  const hasEnoughPoints = totalInsightPoints !== null ? totalInsightPoints >= hintCost : false;
  const costKnown = totalInsightPoints !== null && !loadingProgress;
  const insufficientPoints = costKnown && !freeHintAvailable && !hasEnoughPoints;
  const buttonDisabled = disabled || pending || loadingProgress || !costKnown || insufficientPoints;

  const costLabel = loadingProgress
    ? t("question_hint_loading_cost")
    : freeHintAvailable
      ? t("question_hint_free_available", { points: hintCost })
      : insufficientPoints
        ? t("question_hint_cost_unavailable", { points: hintCost })
        : t("question_hint_cost", { points: hintCost });

  const useLabel = pending ? t("question_hint_using") : hasUsedHintThisQuestion ? t("question_hint_use_another") : t("question_hint_use");

  return (
    <div className="min-w-0 rounded-2xl bg-pastel-amber/10 p-3 text-sm ring-1 ring-inset ring-pastel-amber/25">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pastel-amber/15 text-pastel-amber shadow-[0_0_16px_color-mix(in_srgb,var(--color-pastel-amber)_25%,transparent)]">
          <LightbulbIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-pastel-amber">{t("question_hint_title")}</p>
          <p className="mt-0.5 text-xs text-ink-300">{costLabel}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void onUseHint()}
        disabled={buttonDisabled}
        className="mt-3 w-full rounded-xl bg-pastel-amber px-3 py-2.5 text-sm font-semibold text-base-900 shadow-[0_0_16px_color-mix(in_srgb,var(--color-pastel-amber)_30%,transparent)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-pastel-amber/35 disabled:shadow-none disabled:brightness-100"
      >
        {useLabel}
      </button>
    </div>
  );
}
