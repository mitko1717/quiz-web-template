"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/components/AuthGate";
import { DifficultySelector } from "@/components/DifficultySelector";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/button";
import { Modal } from "@/components/common/Modal";
import { useQuiz } from "@/hooks/useQuiz";
import { useProfileQuery, useUpdateProfileDifficultyMutation } from "@/hooks/useProfile";
import { useReferralLink } from "@/hooks/useReferralLink";
import { shareViaTelegram } from "@/lib/share";
import { DashboardHeader } from "./DashboardHeader";
import { useI18n } from "@/components/I18nProvider";
import { AdaptiveDifficultySuggestion, type DifficultyLevel } from "@/lib/types";
import { topicConfig } from "@/lib/topic.config";
import { MoreGamesSection } from "./MoreGamesSection";

// Each entry is the streak-threshold table used the Nth time the MOVE_UP suggestion fires on a
// given level (index 0 = first time, index 1 = second time, ...). If it fires more times than
// there are tables, the last table is reused. Level 5 has no "next level" so it's absent from
// every table on purpose.
const HIGHER_LEVEL_SUGGESTION_STREAK_TABLES: Partial<Record<DifficultyLevel, number>>[] = [
  { 1: 3, 2: 5, 3: 7, 4: 10 },
  { 1: 5, 2: 7, 3: 9, 4: 12 },
  { 1: 5, 2: 7, 3: 10, 4: 12 },
  { 1: 7, 2: 9, 3: 12, 4: 14 },
];

function getRequiredStreak(difficulty: DifficultyLevel, timesShownThisLevel: number): number | undefined {
  const tableIndex = Math.min(timesShownThisLevel, HIGHER_LEVEL_SUGGESTION_STREAK_TABLES.length - 1);
  return HIGHER_LEVEL_SUGGESTION_STREAK_TABLES[tableIndex][difficulty];
}

const ALL_LEVELS: DifficultyLevel[] = [1, 2, 3, 4, 5];

type SuggestionKind = "up" | "down";

export function QuizPlayground() {
  const { t } = useI18n();
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const profileQuery = useProfileQuery(token);
  const updateDifficultyMutation = useUpdateProfileDifficultyMutation(token);
  const allowReverseMode = profileQuery.data?.allowReverseMode ?? true;
  const referralLink = useReferralLink(profileQuery.data);

  const {
    difficulty,
    setDifficulty,
    inputMode,
    setInputMode,
    questionDirection,
    setQuestionDirection,
    questionScope,
    setQuestionScope,
    question,
    selectedOption,
    setSelectedOption,
    answerResult,
    skipResult,
    hintResult,
    wrongSelections,
    currentProgress,
    stats,
    totalInsightPoints,
    loadingStats,
    loadingQuestion,
    submittingAnswer,
    usingHint,
    error,
    difficultySuggestion,
    refetchStats,
    submitAnswer,
    skipQuestion,
    useHint,
    nextQuestion,
    unlockedAchievements,
    dismissUnlockedAchievement,
  } = useQuiz(token, allowReverseMode);

  const appliedProfileDifficultyRef = useRef(false);
  const sessionCorrectStreakRef = useRef(0);
  const suggestionCountByLevelRef = useRef<Map<DifficultyLevel, number>>(new Map());
  const lastProcessedAnswerKeyRef = useRef<string | null>(null);
  const unlockNotifiedLevelsRef = useRef<Set<DifficultyLevel>>(new Set());
  const previousUnlockedMapRef = useRef<Map<DifficultyLevel, boolean> | null>(null);
  const downNotifiedLevelsRef = useRef<Set<DifficultyLevel>>(new Set());
  const shareStreakRef = useRef(0);
  const lastProcessedShareKeyRef = useRef<string | null>(null);
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<DifficultyLevel | null>(null);
  const [suggestionKind, setSuggestionKind] = useState<SuggestionKind>("up");
  const [shareStreakCount, setShareStreakCount] = useState<number | null>(null);

  useEffect(() => {
    appliedProfileDifficultyRef.current = false;
  }, [token]);

  useEffect(() => {
    const preferred = profileQuery.data?.preferredDifficultyLevel;
    if (!preferred || appliedProfileDifficultyRef.current) return;

    setDifficulty(preferred);
    appliedProfileDifficultyRef.current = true;
  }, [profileQuery.data?.preferredDifficultyLevel, setDifficulty]);

  const handleDifficultyChange = useCallback((level: DifficultyLevel) => {
    setDifficulty(level);
    void updateDifficultyMutation.mutateAsync(level).catch(() => undefined);
  }, [setDifficulty, updateDifficultyMutation]);

  // Reset per-level guards whenever the player switches levels — thresholds and "already
  // shown" state are per-level, not global.
  useEffect(() => {
    sessionCorrectStreakRef.current = 0;
    suggestionCountByLevelRef.current = new Map();
    lastProcessedAnswerKeyRef.current = null;
    downNotifiedLevelsRef.current = new Set();
    shareStreakRef.current = 0;
    lastProcessedShareKeyRef.current = null;
  }, [difficulty]);

  // TRIGGER A: fires the moment a level genuinely transitions locked -> unlocked (server-confirmed
  // via stats.progression.levels[].unlocked), independent of streak/accuracy. This is the "you just
  // unlocked a new level" notification — distinct from triggers B and C. Compares against the
  // previous snapshot of unlocked flags to detect the transition; fires once per level ever
  // (per session — the ref resets on remount).
  useEffect(() => {
    const levels = stats?.progression.levels;
    if (!levels || levels.length === 0) return;

    const currentMap = new Map<DifficultyLevel, boolean>();
    for (const row of levels) currentMap.set(row.difficultyLevel, row.unlocked);

    const previousMap = previousUnlockedMapRef.current;
    previousUnlockedMapRef.current = currentMap;
    if (!previousMap) return; // first snapshot — nothing to diff against yet, avoids a false-positive on load

    for (const level of ALL_LEVELS) {
      const wasUnlocked = previousMap.get(level) ?? false;
      const isUnlocked = currentMap.get(level) ?? false;
      if (!wasUnlocked && isUnlocked && !unlockNotifiedLevelsRef.current.has(level)) {
        unlockNotifiedLevelsRef.current.add(level);
        setSuggestionKind("up");
        setSuggestedDifficulty(level);
        break;
      }
    }
  }, [stats]);

  // TRIGGER B/C/SHARE: a single answer-driven effect handles three independent things that
  // all key off "was this answer correct, and what's the running streak":
  //   B: progressive streak table + server MOVE_UP + unlock re-check -> "try next level" modal
  //   C: server MOVE_DOWN signal -> "drop down?" modal (fires on any answer, not just correct)
  //   SHARE: every time the streak hits a multiple of shareStreakThresholdByDifficulty[difficulty]
  //          -> a lightweight, dismissible "share your streak" modal (repeats every threshold
  //          multiple, unlike B/C which are gated to fire once per escalation)
  useEffect(() => {
    if (!answerResult) return;

    const answerKey = `${question?.itemId ?? 'unknown'}:${difficulty}:${answerResult.updatedStreak}:${answerResult.correct}`;
    if (lastProcessedAnswerKeyRef.current === answerKey) return;
    lastProcessedAnswerKeyRef.current = answerKey;

    if (!answerResult.correct) {
      sessionCorrectStreakRef.current = 0;
      shareStreakRef.current = 0;
    } else {
      sessionCorrectStreakRef.current += 1;
      shareStreakRef.current += 1;

      const shareThreshold = profileQuery.data?.shareStreakThresholdByDifficulty?.[difficulty];
      const shareKey = `${difficulty}:${shareStreakRef.current}`;
      if (shareThreshold && shareStreakRef.current % shareThreshold === 0 && lastProcessedShareKeyRef.current !== shareKey) {
        lastProcessedShareKeyRef.current = shareKey;
        setShareStreakCount(shareStreakRef.current);
      }
    }

    if (answerResult.correct) {
      const timesShownThisLevel = suggestionCountByLevelRef.current.get(difficulty) ?? 0;
      const requiredStreak = getRequiredStreak(difficulty, timesShownThisLevel);
      const nextDifficulty = (difficulty + 1) as DifficultyLevel;

      if (
        requiredStreak !== undefined &&
        sessionCorrectStreakRef.current >= requiredStreak &&
        difficultySuggestion === AdaptiveDifficultySuggestion.MOVE_UP &&
        nextDifficulty <= 5
      ) {
        void (async () => {
          const fresh = await refetchStats();
          const nextLevelUnlocked = fresh.data?.progression.levels.find((lvl) => lvl.difficultyLevel === nextDifficulty)?.unlocked ?? false;
          if (!nextLevelUnlocked) return;

          sessionCorrectStreakRef.current = 0;
          suggestionCountByLevelRef.current.set(difficulty, timesShownThisLevel + 1);
          setSuggestionKind("up");
          setSuggestedDifficulty(nextDifficulty);
        })();
        return;
      }
    }

    const previousDifficulty = (difficulty - 1) as DifficultyLevel;
    if (
      !answerResult.correct &&
      difficultySuggestion === AdaptiveDifficultySuggestion.MOVE_DOWN &&
      previousDifficulty >= 1 &&
      !downNotifiedLevelsRef.current.has(difficulty)
    ) {
      downNotifiedLevelsRef.current.add(difficulty);
      setSuggestionKind("down");
      setSuggestedDifficulty(previousDifficulty);
    }
  }, [answerResult, difficulty, difficultySuggestion, profileQuery.data?.shareStreakThresholdByDifficulty, question?.itemId, refetchStats]);

  const closeSuggestionModal = useCallback(() => {
    setSuggestedDifficulty(null);
  }, []);

  const closeShareStreakModal = useCallback(() => {
    setShareStreakCount(null);
  }, []);

  const handleShareLevel = useCallback(async () => {
    if (!referralLink) return;
    const text = t('share_hook_level', { level: difficulty, appName: topicConfig.appName, link: referralLink });
    await shareViaTelegram(text);
  }, [difficulty, referralLink, t]);

  const handleShareStreak = useCallback(async () => {
    if (!referralLink || shareStreakCount === null) return;
    const text = t('share_hook_streak', { streak: shareStreakCount, level: difficulty, appName: topicConfig.appName, link: referralLink });
    await shareViaTelegram(text);
  }, [difficulty, referralLink, shareStreakCount, t]);

  const shouldShowSuggestionModal = suggestedDifficulty !== null;

  const streakModalNextLevel = ((): DifficultyLevel | null => {
    if (shareStreakCount === null || difficulty >= 5) return null;
    const nextDifficulty = (difficulty + 1) as DifficultyLevel;
    const isUnlocked = stats?.progression.levels.find((lvl) => lvl.difficultyLevel === nextDifficulty)?.unlocked ?? false;
    return isUnlocked ? nextDifficulty : null;
  })();

  return (
    <section className="w-full space-y-2.5 sm:space-y-3">
      <DashboardHeader
        authMode={authMode}
        username={username}
        dailyStreak={profileQuery.data?.dailyStreak ?? 0}
        totalInsightPoints={totalInsightPoints}
        onLanguageChange={setPreferredLanguage}
      />
      <div className="flex flex-col gap-1.5">
        <DifficultySelector
          value={difficulty}
          progression={stats?.progression ?? null}
          onChange={handleDifficultyChange}
          disabled={loadingQuestion || submittingAnswer || loadingStats}
          layout="slider"
        />
      </div>

      <Modal
        isOpen={shouldShowSuggestionModal}
        onClose={closeSuggestionModal}
        closeLabel={t("common_dismiss")}
        title={t("difficulty_label")}
        description={t(suggestionKind === "up" ? "question_suggestion_up" : "question_suggestion_down")}
        footer={
          <div className="space-y-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <Button
                type="button"
                variant="suggestionNeutral"
                size="sm"
                onClick={closeSuggestionModal}
                className="w-full rounded-lg uppercase tracking-[0.1em] sm:w-auto"
              >
                {t("common_dismiss")}
              </Button>
              {suggestedDifficulty !== null ? (
                <Button
                  type="button"
                  variant="suggestionAccent"
                  size="sm"
                  onClick={() => {
                    handleDifficultyChange(suggestedDifficulty);
                    closeSuggestionModal();
                  }}
                  className="w-full rounded-lg uppercase tracking-[0.1em] sm:w-auto"
                >
                  {t("question_suggestion_try_level", { level: suggestedDifficulty })}
                </Button>
              ) : null}
            </div>
            {suggestionKind === "up" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleShareLevel()}
                disabled={!referralLink}
                className="w-full rounded-lg uppercase tracking-[0.1em]"
              >
                {t("share_button")}
              </Button>
            ) : null}
            <MoreGamesSection token={token} />
          </div>
        }
      />

      <Modal
        isOpen={shareStreakCount !== null}
        onClose={closeShareStreakModal}
        closeLabel={t("common_dismiss")}
        title={t("share_streak_modal_title")}
        description={shareStreakCount !== null ? t("share_streak_modal_desc", { streak: shareStreakCount, level: difficulty }) : ""}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="suggestionNeutral"
              size="sm"
              onClick={closeShareStreakModal}
              className="w-full rounded-lg uppercase tracking-[0.1em] sm:w-auto"
            >
              {t("common_dismiss")}
            </Button>
            {streakModalNextLevel !== null ? (
              <Button
                type="button"
                variant="suggestionAccent"
                size="sm"
                onClick={() => {
                  handleDifficultyChange(streakModalNextLevel);
                  closeShareStreakModal();
                }}
                className="w-full rounded-lg uppercase tracking-[0.1em] sm:w-auto"
              >
                {t("question_suggestion_try_level", { level: streakModalNextLevel })}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleShareStreak()}
              disabled={!referralLink}
              className="w-full rounded-lg uppercase tracking-[0.1em] sm:w-auto"
            >
              {t("share_button")}
            </Button>
          </div>
        }
      />

      <QuestionCard
        question={question}
        loadingQuestion={loadingQuestion}
        submittingAnswer={submittingAnswer}
        selectedOption={selectedOption}
        answerResult={answerResult}
        skipResult={skipResult}
        hintResult={hintResult}
        currentProgress={currentProgress}
        wrongSelections={wrongSelections}
        loadingStats={loadingStats}
        totalInsightPoints={totalInsightPoints}
        usingHint={usingHint}
        error={error}
        onSelectOption={setSelectedOption}
        onSubmitAnswer={submitAnswer}
        onSkipQuestion={skipQuestion}
        onUseHint={useHint}
        onNextQuestion={nextQuestion}
        inputMode={inputMode}
        onInputModeChange={setInputMode}
        questionDirection={questionDirection}
        onQuestionDirectionChange={setQuestionDirection}
        questionScope={questionScope}
        onQuestionScopeChange={setQuestionScope}
        allowReverseMode={allowReverseMode}
        hintCost={profileQuery.data?.hintCostByDifficulty?.[difficulty] ?? difficulty}
        unlockedAchievements={unlockedAchievements}
        onDismissAchievement={dismissUnlockedAchievement}
      />
    </section>
  );
}