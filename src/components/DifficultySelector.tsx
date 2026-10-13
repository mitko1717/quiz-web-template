"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Modal } from "@/components/common/Modal";
import { ChevronRightIcon, LockIcon } from "@/components/icons";
import type { DifficultyLevel, DifficultyProgressionResponse } from "@/lib";
import { LEVELS } from "@/lib";
import { useI18n } from "@/components/I18nProvider";

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel) => void;
  progression: DifficultyProgressionResponse | null;
  disabled?: boolean;
  layout?: "grid" | "slider" | "bar";
}

export function DifficultySelector(props: DifficultySelectorProps) {
  if (props.layout === "bar") return <DifficultyBar {...props} />;
  return <DifficultyCards {...props} />;
}

function DifficultyBar({ value, onChange, progression, disabled = false }: DifficultySelectorProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const nextLevel = value < 5 ? ((value + 1) as DifficultyLevel) : null;
  const nextData = nextLevel !== null ? progression?.levels.find((e) => e.difficultyLevel === nextLevel) : undefined;
  const nextLocked = nextLevel !== null && nextData !== undefined && !nextData.unlocked;
  const towards = nextData?.correctAnswersTowardsUnlock ?? 0;
  const required = nextData?.requiredCorrectAnswers ?? 0;
  const progressPct = !progression
    ? 0
    : nextLocked
      ? required > 0 ? Math.max(0, Math.min(100, Math.round((towards / required) * 100))) : 0
      : 100;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-label={t("difficulty_label")}
        className="flex w-full min-w-0 items-center gap-3 rounded-2xl bg-base-800/80 px-3 py-2.5 text-left ring-1 ring-inset ring-base-600/50 transition-shadow hover:ring-accent-greenDim"
      >
        <span
          aria-hidden="true"
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-2 ring-accent-green shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent-green)_45%,transparent)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-100">{t("difficulty_level", { level: value })}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-base-600/70">
            <div
              className="h-full rounded-full bg-accent-green shadow-[0_0_8px_color-mix(in_srgb,var(--color-accent-green)_60%,transparent)] transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        {nextLocked && nextLevel !== null ? (
          <div className="flex shrink-0 items-center gap-2 border-l border-base-600/60 pl-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-700/70 text-ink-300">
              <LockIcon className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] text-ink-500">{t("difficulty_level", { level: nextLevel })}</p>
              <p className="text-sm font-semibold tabular-nums text-ink-100">{towards}/{required}</p>
            </div>
          </div>
        ) : null}
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-500" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        closeLabel={t("common_dismiss")}
        title={t("difficulty_label")}
        footer={(
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>{t("common_dismiss")}</Button>
          </div>
        )}
      >
        <DifficultyCards
          value={value}
          progression={progression}
          disabled={disabled}
          layout="grid"
          onChange={(level) => {
            onChange(level);
            setIsOpen(false);
          }}
        />
      </Modal>
    </>
  );
}

function DifficultyCards({ value, onChange, progression, disabled = false, layout = "grid" }: DifficultySelectorProps) {
  const { t, language } = useI18n();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const previousLevelsRef = useRef<Map<DifficultyLevel, { unlocked: boolean; towards: number }> | null>(null);
  const [recentlyUnlockedLevels, setRecentlyUnlockedLevels] = useState<DifficultyLevel[]>([]);
  const [recentlyUpdatedLevels, setRecentlyUpdatedLevels] = useState<DifficultyLevel[]>([]);

  const isSlider = layout === "slider";
  const compactLocale = language !== "en";

  const containerClassName = isSlider
    ? "w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain py-2 scroll-px-4 touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:scroll-px-0 lg:overflow-visible"
    : "grid grid-cols-1 gap-2";
  const innerClassName = isSlider
    ? "flex min-w-max snap-x snap-mandatory gap-2 px-4 sm:px-0 lg:grid lg:min-w-0 lg:grid-cols-5"
    : "contents";
  const sectionClassName = isSlider ? "-mx-4 min-w-0 sm:mx-0" : "w-full";

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

    carousel.scrollTo({ left: Math.max(activeButton.offsetLeft - 16, 0), behavior: "smooth" });
  }, [isSlider, value]);

  return (
    <section className={sectionClassName}>
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
                  "relative overflow-hidden px-3 py-2.5 text-left text-sm",
                  isSlider
                    ? compactLocale
                      ? "w-[min(40vw,150px)] shrink-0 snap-start lg:w-auto lg:shrink lg:snap-none"
                      : "w-[min(36vw,140px)] shrink-0 snap-start lg:w-auto lg:shrink lg:snap-none"
                    : "",
                  showUnlockMotion ? "difficulty-unlock-glow" : "",
                  showProgressPulse ? "difficulty-progress-bump" : "",
                ].join(" ")}
              >
                <div className="relative z-[1] flex items-center justify-between gap-1.5">
                  <span className="block truncate">{t("difficulty_level", { level })}</span>
                  {!unlocked ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-base-600/70 text-ink-300">
                      <LockIcon className="h-3 w-3" />
                    </span>
                  ) : null}
                </div>
                {!unlocked && required > 0 ? (
                  <div className="relative z-[1] mt-2">
                    <div className="h-1 overflow-hidden rounded-full bg-base-600/70">
                      <div
                        className={[
                          "h-full rounded-full bg-accent-green transition-all duration-500",
                          showProgressPulse ? "difficulty-progress-fill-sheen" : "",
                        ].join(" ")}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p
                      className={[
                        "mt-1 text-right text-[11px] font-semibold tabular-nums text-ink-300",
                        showProgressPulse ? "difficulty-progress-count-pop" : "",
                      ].join(" ")}
                    >
                      {towards}/{required}
                    </p>
                  </div>
                ) : showUnlockMotion ? (
                  <span className="relative z-[1] mt-1.5 block text-xs difficulty-unlocked-label">
                    {t("difficulty_unlocked_now")}
                  </span>
                ) : null}
                {showUnlockMotion ? (
                  <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-pastel-mint/0 via-pastel-mint/20 to-pastel-sky/0 opacity-90 difficulty-unlock-sweep" />
                ) : null}
                <span className="sr-only">
                  {unlocked
                    ? t("difficulty_open")
                    : `${t("difficulty_locked")} ${t("difficulty_left_to_unlock", { count: leftToUnlock })}. ${t("difficulty_unlock_progress", { current: towards, required })}`}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
