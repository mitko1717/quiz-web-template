"use client";

import { Button } from "@/components/button";
import { useI18n } from "@/components/I18nProvider";
import type { DifficultyLevel, ProgressResponse } from "@/lib/types";

type HintButtonProps = {
  difficulty: DifficultyLevel;
  progress: ProgressResponse | null;
  loadingProgress: boolean;
  disabled: boolean;
  pending: boolean;
  onUseHint: () => Promise<void>;
};

function getHintCost(difficulty: DifficultyLevel): number {
  return difficulty;
}

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

export function HintButton({ difficulty, progress, loadingProgress, disabled, pending, onUseHint }: HintButtonProps) {
  const { t } = useI18n();
  const hintCost = getHintCost(difficulty);
  const freeHintAvailable = progress ? hasFreeHintAvailable(progress.lastFreeHintUsedAt) : false;
  const hasEnoughPoints = progress ? progress.insightPoints >= hintCost : false;
  const costKnown = Boolean(progress) && !loadingProgress;
  const insufficientPoints = costKnown && !freeHintAvailable && !hasEnoughPoints;
  const buttonDisabled = disabled || pending || loadingProgress || !costKnown || insufficientPoints;

  const costLabel = loadingProgress
    ? t("question_hint_loading_cost")
    : freeHintAvailable
      ? t("question_hint_free_available", { points: hintCost })
      : insufficientPoints
        ? t("question_hint_cost_unavailable", { points: hintCost })
        : t("question_hint_cost", { points: hintCost });

  return (
    <div className="min-w-0 rounded-xl border border-pastel-amber/35 bg-pastel-amber/10 p-3 text-sm text-ink-200">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-pastel-amber">{t("question_hint_title")}</p>
          <p className="mt-1 text-xs text-ink-300">{costLabel}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full border-pastel-amber/60 text-pastel-amber hover:border-pastel-amber hover:text-pastel-amber sm:w-auto"
          onClick={() => void onUseHint()}
          disabled={buttonDisabled}
        >
          {pending ? t("question_hint_using") : t("question_hint_use")}
        </Button>
      </div>
    </div>
  );
}
