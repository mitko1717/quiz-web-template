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

  const shownHigherLevelSuggestionLevelsRef = useRef<Set<DifficultyLevel>>(new Set());
  const lastProcessedSuggestionKeyRef = useRef<string | null>(null);
  const appliedProfileDifficultyRef = useRef(false);
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

  // Reset the "already shown" guard whenever the player switches levels — a MOVE_UP
  // suggestion for a level should be eligible to show again if they come back to it later.
  useEffect(() => {
    shownHigherLevelSuggestionLevelsRef.current = new Set();
  }, [difficulty]);

  // Server is the source of truth for both signals we need here: (1) whether the player
  // is doing well enough to suggest moving up (AdaptiveDifficultyLogic, last-10 accuracy —
  // independent of unlockThresholds) and (2) whether the next level is actually unlocked
  // (progression.levels[].unlocked, computed from real correct-answer counts). Neither
  // signal alone is enough — a MOVE_UP suggestion says nothing about unlock status, and the
  // cached `stats` query (20s staleTime, no refetchOnMount/refetchOnWindowFocus) can be stale
  // right after an admin changes unlockThresholds. So on a MOVE_UP signal we force a fresh
  // refetch of stats before deciding, instead of trusting whatever is currently cached.
  useEffect(() => {
    console.log('[suggestion-debug] effect fired', { answerResult: !!answerResult, difficultySuggestion });
    if (!answerResult || difficultySuggestion !== AdaptiveDifficultySuggestion.MOVE_UP) {
      console.log('[suggestion-debug] blocked at first guard');
      return;
    }

    const answerKey = `${question?.itemId ?? 'unknown'}:${difficulty}:${answerResult.updatedStreak}`;
    if (lastProcessedSuggestionKeyRef.current === answerKey) {
      console.log('[suggestion-debug] blocked: already processed this answerKey', answerKey);
      return;
    }
    lastProcessedSuggestionKeyRef.current = answerKey;

    const nextDifficulty = (difficulty + 1) as DifficultyLevel;
    if (nextDifficulty > 5 || shownHigherLevelSuggestionLevelsRef.current.has(nextDifficulty)) {
      console.log('[suggestion-debug] blocked: nextDifficulty out of range or already shown', nextDifficulty);
      return;
    }

    void (async () => {
      try {
        const fresh = await refetchStats();
        console.log('[suggestion-debug] fresh stats:', fresh.data?.progression);
        const nextLevelUnlocked = fresh.data?.progression.levels.find((lvl) => lvl.difficultyLevel === nextDifficulty)?.unlocked ?? false;
        console.log('[suggestion-debug] nextDifficulty:', nextDifficulty, 'unlocked:', nextLevelUnlocked);
        if (!nextLevelUnlocked) return;

        shownHigherLevelSuggestionLevelsRef.current.add(nextDifficulty);
        setSuggestedDifficulty(nextDifficulty);
      } catch (err) {
        console.error('[suggestion-debug] refetchStats failed:', err);
      }
    })();
  }, [answerResult, difficulty, difficultySuggestion, question?.itemId, refetchStats]);

  const closeSuggestionModal = useCallback(() => {
    setSuggestedDifficulty(null);
  }, []);

  const nextDifficultyForCurrentLevel = difficulty < 5 ? ((difficulty + 1) as DifficultyLevel) : null;
  const shouldShowSuggestionModal = suggestedDifficulty !== null && suggestedDifficulty === nextDifficultyForCurrentLevel;

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
        unlockedAchievements={unlockedAchievements}
        onDismissAchievement={dismissUnlockedAchievement}
      />
    </section>
  );
}