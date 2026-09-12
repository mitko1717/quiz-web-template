"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/components/AuthGate";
import { DifficultySelector } from "@/components/DifficultySelector";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/button";
import { Modal } from "@/components/common/Modal";
import { useQuiz } from "@/hooks/useQuiz";
import { useProfileQuery, useUpdateProfileDifficultyMutation } from "@/hooks/useProfile";
import { DashboardHeader } from "./DashboardHeader";
import { useI18n } from "@/components/I18nProvider";
import { AdaptiveDifficultySuggestion, type DifficultyLevel } from "@/lib/types";
import { MoreGamesSection } from "./MoreGamesSection";

// Each entry is the streak-threshold table used the Nth time the suggestion fires on a given
// level (index 0 = first time, index 1 = second time, ...). If the suggestion fires more times
// than there are tables, the last table is reused. Level 5 has no "next level" so it's absent
// from every table on purpose.
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

export function QuizPlayground() {
  const { t } = useI18n();
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const profileQuery = useProfileQuery(token);
  const updateDifficultyMutation = useUpdateProfileDifficultyMutation(token);
  const allowReverseMode = profileQuery.data?.allowReverseMode ?? true;

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
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<DifficultyLevel | null>(null);

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

  // Reset the streak counter and the per-level "how many times shown" counter whenever the
  // player switches levels — thresholds and progress are per-level, not global.
  useEffect(() => {
    sessionCorrectStreakRef.current = 0;
    suggestionCountByLevelRef.current = new Map();
    lastProcessedAnswerKeyRef.current = null;
  }, [difficulty]);

  // TRIGGER A: fires the moment a level genuinely transitions locked -> unlocked (server-confirmed
  // via stats.progression.levels[].unlocked), independent of streak/accuracy. This is the "you just
  // unlocked a new level" notification — distinct from trigger B below. Compares against the
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
        setSuggestedDifficulty(level);
        break;
      }
    }
  }, [stats]);

  // TRIGGER B: client-side streak counter drives WHEN to even check (progressive threshold
  // table, resets to 0 on any wrong answer). The server's difficultySuggestion (MOVE_UP,
  // last-10-attempt accuracy) plus a fresh unlocked-check still gate whether we actually show
  // it — this is the "you're doing great, the next level is already open, want to try it?"
  // notification for a level the player already unlocked earlier but hasn't moved to.
  useEffect(() => {
    if (!answerResult) return;

    const answerKey = `${question?.itemId ?? 'unknown'}:${difficulty}:${answerResult.updatedStreak}:${answerResult.correct}`;
    if (lastProcessedAnswerKeyRef.current === answerKey) return;
    lastProcessedAnswerKeyRef.current = answerKey;

    if (!answerResult.correct) {
      sessionCorrectStreakRef.current = 0;
      return;
    }
    sessionCorrectStreakRef.current += 1;

    const timesShownThisLevel = suggestionCountByLevelRef.current.get(difficulty) ?? 0;
    const requiredStreak = getRequiredStreak(difficulty, timesShownThisLevel);
    if (requiredStreak === undefined) return;
    if (sessionCorrectStreakRef.current < requiredStreak) return;
    if (difficultySuggestion !== AdaptiveDifficultySuggestion.MOVE_UP) return;

    const nextDifficulty = (difficulty + 1) as DifficultyLevel;
    if (nextDifficulty > 5) return;

    void (async () => {
      const fresh = await refetchStats();
      const nextLevelUnlocked = fresh.data?.progression.levels.find((lvl) => lvl.difficultyLevel === nextDifficulty)?.unlocked ?? false;
      if (!nextLevelUnlocked) return;

      sessionCorrectStreakRef.current = 0;
      suggestionCountByLevelRef.current.set(difficulty, timesShownThisLevel + 1);
      setSuggestedDifficulty(nextDifficulty);
    })();
  }, [answerResult, difficulty, difficultySuggestion, question?.itemId, refetchStats]);

  const closeSuggestionModal = useCallback(() => {
    setSuggestedDifficulty(null);
  }, []);

  const shouldShowSuggestionModal = suggestedDifficulty !== null;

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
        description={t("question_suggestion_up")}
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
            <MoreGamesSection token={token} />
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
        totalInsightPoints={currentProgress?.insightPoints ?? null}
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