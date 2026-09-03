"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/components/AuthGate";
import { DifficultySelector } from "@/components/DifficultySelector";
import { QuestionCard } from "@/components/QuestionCard";
import { Button } from "@/components/button";
import { Modal } from "@/components/Modal";
import { useQuiz } from "@/hooks/useQuiz";
import { useProfileQuery, useUpdateProfileDifficultyMutation } from "@/hooks/useProfile";
import { DashboardHeader } from "./DashboardHeader";
import { useI18n } from "@/components/I18nProvider";
import { type DifficultyLevel } from "@/lib/types";
import { MoreGamesSection } from "./MoreGamesSection";

const HIGHER_LEVEL_SUGGESTION_STREAKS: Partial<Record<DifficultyLevel, number>> = {
  1: 3,
  2: 5,
  3: 7,
  4: 10,
};

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
    submitAnswer,
    skipQuestion,
    useHint,
    nextQuestion,
  } = useQuiz(token, allowReverseMode);

  const highestUnlockedDifficulty = stats?.progression.highestUnlockedDifficulty ?? 1;
  const sessionCorrectStreakRef = useRef(0);
  const lastProcessedAnswerRef = useRef<string | null>(null);
  const shownHigherLevelSuggestionLevelsRef = useRef<Set<DifficultyLevel>>(new Set());
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

  useEffect(() => {
    sessionCorrectStreakRef.current = 0;
    lastProcessedAnswerRef.current = null;
  }, [difficulty]);

  useEffect(() => {
    if (skipResult) sessionCorrectStreakRef.current = 0;
  }, [skipResult]);

  useEffect(() => {
    if (!answerResult) return;

    const answerKey = `${question?.itemId ?? 'unknown'}:${difficulty}:${answerResult.correct}:${answerResult.answerRevealed}:${answerResult.updatedStreak}:${answerResult.attemptsRemaining}`;
    const isNewAnswer = lastProcessedAnswerRef.current !== answerKey;

    if (isNewAnswer) {
      lastProcessedAnswerRef.current = answerKey;

      if (!answerResult.correct) {
        sessionCorrectStreakRef.current = 0;
        return;
      }

      sessionCorrectStreakRef.current += 1;
    } else if (!answerResult.correct) {
      return;
    }

    const nextDifficulty = (difficulty + 1) as DifficultyLevel;
    const requiredStreak = HIGHER_LEVEL_SUGGESTION_STREAKS[difficulty];
    if (
      requiredStreak !== undefined &&
      sessionCorrectStreakRef.current >= requiredStreak &&
      nextDifficulty <= highestUnlockedDifficulty &&
      !shownHigherLevelSuggestionLevelsRef.current.has(nextDifficulty)
    ) {
      shownHigherLevelSuggestionLevelsRef.current.add(nextDifficulty);
      sessionCorrectStreakRef.current = 0;
      setSuggestedDifficulty(nextDifficulty);
    }
  }, [answerResult, difficulty, highestUnlockedDifficulty, question?.itemId]);

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
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
      />
    </section>
  );
}
