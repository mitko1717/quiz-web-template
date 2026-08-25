"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import type { DifficultyLevel, DifficultyProgressionResponse } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";

const LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel) => void;
  progression: DifficultyProgressionResponse | null;
  disabled?: boolean;
  layout?: "grid" | "slider";
}

export function DifficultySelector({ value, onChange, progression, disabled = false, layout = "grid" }: DifficultySelectorProps) {
  const { t, language } = useI18n();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const previousLevelsRef = useRef<Map<DifficultyLevel, { unlocked: boolean; towards: number }> | null>(null);
  const [recentlyUnlockedLevels, setRecentlyUnlockedLevels] = useState<DifficultyLevel[]>([]);
  const [recentlyUpdatedLevels, setRecentlyUpdatedLevels] = useState<DifficultyLevel[]>([]);

  const isSlider = layout === "slider";
  const compactLocale = language !== "en";

  const containerClassName = isSlider
    ? "w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:pb-0"
    : "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5";
  const innerClassName = isSlider ? "flex min-w-max snap-x snap-mandatory gap-1.5 pr-3 lg:grid lg:min-w-0 lg:grid-cols-5 lg:gap-1.5 lg:pr-0" : "contents";
  const sectionClassName = isSlider
    ? "w-full min-w-0 max-w-full basis-full flex-1 overflow-hidden rounded-xl border border-base-600 bg-base-800 p-1.5"
    : "w-full rounded-xl border border-base-600 bg-base-800 p-1.5";

  useEffect(() => {
    if (!progression?.levels.length) {
      previousLevelsRef.current = null;
      return;
    }

    const currentMap = new Map<DifficultyLevel, { unlocked: boolean; towards: number }>();
    for (const row of progression.levels) {
      currentMap.set(row.difficultyLevel, {
        unlocked: row.unlocked,
        towards: row.correctAnswersTowardsUnlock,
      });
    }

    const previousMap = previousLevelsRef.current;
    previousLevelsRef.current = currentMap;
    if (!previousMap) return;

    const unlockedNow: DifficultyLevel[] = [];
    const updatedNow: DifficultyLevel[] = [];

    for (const level of LEVELS) {
      const prev = previousMap.get(level);
      const curr = currentMap.get(level);
      if (!prev || !curr) continue;
      if (!prev.unlocked && curr.unlocked) unlockedNow.push(level);
      if (curr.towards !== prev.towards) updatedNow.push(level);
    }

    const timers: number[] = [];

    if (unlockedNow.length > 0) {
      const addTimer = window.setTimeout(() => {
        setRecentlyUnlockedLevels((prev) => Array.from(new Set([...prev, ...unlockedNow])));
      }, 0);
      const removeTimer = window.setTimeout(() => {
        setRecentlyUnlockedLevels((prev) => prev.filter((level) => !unlockedNow.includes(level)));
      }, 2100);
      timers.push(addTimer, removeTimer);
    }

    if (updatedNow.length > 0) {
      const addTimer = window.setTimeout(() => {
        setRecentlyUpdatedLevels((prev) => Array.from(new Set([...prev, ...updatedNow])));
      }, 0);
      const removeTimer = window.setTimeout(() => {
        setRecentlyUpdatedLevels((prev) => prev.filter((level) => !updatedNow.includes(level)));
      }, 650);
      timers.push(addTimer, removeTimer);
    }

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [progression]);

  useEffect(() => {
    if (!isSlider || !carouselRef.current) return;

    const carousel = carouselRef.current;
    const activeButton = carouselRef.current.querySelector<HTMLButtonElement>(`button[data-level="${value}"]`);
    if (!activeButton) return;

    carousel.scrollTo({ left: Math.max(activeButton.offsetLeft - 8, 0), behavior: "smooth" });
  }, [isSlider, value]);

  return (
    <section className={sectionClassName}>
      <div>
        <div className={containerClassName} ref={isSlider ? carouselRef : undefined}>
          <div className={innerClassName}>
            {LEVELS.map((level) => {
              const active = value === level;
              const levelData = progression?.levels.find((e) => e.difficultyLevel === level);
              const unlocked = levelData?.unlocked ?? level === 1;
              const buttonDisabled = disabled || !unlocked;
              const towards = levelData?.correctAnswersTowardsUnlock ?? 0;
              const required = levelData?.requiredCorrectAnswers ?? 0;
              const leftToUnlock = Math.max(required - towards, 0);
              const progressPct = required > 0 ? Math.max(0, Math.min(100, Math.round((towards / required) * 100))) : 0;
              const showUnlockMotion = recentlyUnlockedLevels.includes(level);
              const showProgressPulse = recentlyUpdatedLevels.includes(level);
              const variant = active ? "difficultyActive" : unlocked ? "difficultyOpen" : "difficultyLocked";

              return (
                <Button
                  key={level}
                  type="button"
                  variant={variant}
                  data-level={level}
                  onClick={() => onChange(level)}
                  disabled={buttonDisabled}
                  className={[
                    "relative min-h-10 overflow-hidden px-2 py-1.5",
                    isSlider
                      ? compactLocale
                        ? "w-[min(58vw,172px)] shrink-0 snap-start lg:w-auto lg:max-w-none lg:shrink lg:snap-none"
                        : "w-[min(54vw,152px)] shrink-0 snap-start lg:w-auto lg:max-w-none lg:shrink lg:snap-none"
                      : "",
                    "text-xs sm:text-sm",
                    showUnlockMotion ? "difficulty-unlock-glow" : "",
                    showProgressPulse ? "difficulty-progress-bump" : "",
                  ].join(" ")}
                >
                  <div className="relative z-[1] flex items-start justify-between gap-1.5">
                    <span className="block">{t("difficulty_level", { level })}</span>
                    <span
                      className={[
                        "block rounded-full px-1.5 py-0.5 font-semibold",
                        compactLocale ? "text-[8.5px] tracking-[0.05em]" : "text-[9px] uppercase tracking-[0.08em]",
                        unlocked ? "bg-accent-green/20 text-accent-green" : "bg-base-600/70 text-ink-300",
                      ].join(" ")}
                    >
                      {unlocked ? t("difficulty_open") : t("difficulty_locked")}
                    </span>
                  </div>
                  {!unlocked && required > 0 ? (
                    <div className="relative z-[1]">
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs sm:text-sm">
                        <span className={showProgressPulse ? "difficulty-progress-count-pop font-bold text-pastel-amber" : "font-bold text-pastel-amber"}>
                          {t("difficulty_left_to_unlock", { count: leftToUnlock })}
                        </span>
                        <span className={showProgressPulse ? "difficulty-progress-count-pop font-semibold text-ink-300" : "font-semibold text-ink-300"}>
                          {t("difficulty_unlock_progress", { current: towards, required })}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-base-600">
                        <div
                          className={[
                            "h-full rounded-full bg-gradient-to-r from-pastel-amber via-pastel-mint to-pastel-sky transition-all duration-500",
                            showProgressPulse ? "difficulty-progress-fill-sheen" : "",
                          ].join(" ")}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span
                      className={[
                        "relative z-[1] mt-1.5 block text-xs text-ink-400",
                        showUnlockMotion ? "difficulty-unlocked-label" : "",
                      ].join(" ")}
                    >
                      {showUnlockMotion ? t("difficulty_unlocked_now") : "\u00a0"}
                    </span>
                  )}
                  {showUnlockMotion ? (
                    <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-pastel-mint/0 via-pastel-mint/20 to-pastel-sky/0 opacity-90 difficulty-unlock-sweep" />
                  ) : null}
                  {!unlocked && required > 0 ? (
                    <span className="sr-only">
                      {t("difficulty_left_to_unlock", { count: leftToUnlock })}. {t("difficulty_unlock_progress", { current: towards, required })}
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
