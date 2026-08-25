"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { readStoredInputMode, readStoredQuestionDirection, readStoredQuestionScope, writeStoredInputMode, writeStoredQuestionDirection, writeStoredQuestionScope } from "@/lib/quiz-mode-preferences";
import { useAnswerStatsQuery, useProgressForLevelQuery } from "@/hooks/useProgress";
import { AdaptiveDifficultySuggestion, HintType, QuestionDirection, QuizContinentScope, QuizInputMode, type AnswerResponse, type DifficultyLevel, type HintResponse, type ProgressResponse, type QuestionResponse, type SkipResponse, type UserAnswerStatsResponse } from "@/lib/types";
import { useI18n } from "@/providers/I18nProvider";

type QuizError = string | null;

interface UseQuizResult {
  difficulty: DifficultyLevel;
  setDifficulty: (difficulty: DifficultyLevel) => void;
  inputMode: QuizInputMode;
  setInputMode: (mode: QuizInputMode) => void;
  questionDirection: QuestionDirection;
  setQuestionDirection: (direction: QuestionDirection) => void;
  questionScope: QuizContinentScope;
  setQuestionScope: (scope: QuizContinentScope) => void;
  question: QuestionResponse | null;
  selectedOption: string | null;
  setSelectedOption: (option: string) => void;
  answerResult: AnswerResponse | null;
  skipResult: SkipResponse | null;
  hintResult: HintResponse | null;
  wrongSelections: string[];
  currentProgress: ProgressResponse | null;
  stats: UserAnswerStatsResponse | null;
  totalInsightPoints: number | null;
  loadingStats: boolean;
  statsError: string | null;
  loadingQuestion: boolean;
  submittingAnswer: boolean;
  usingHint: boolean;
  error: QuizError;
  difficultySuggestion: Exclude<AdaptiveDifficultySuggestion, AdaptiveDifficultySuggestion.STAY> | null;
  dismissDifficultySuggestion: () => void;
  hasAnswered: boolean;
  submitAnswer: () => Promise<void>;
  skipQuestion: () => Promise<void>;
  useHint: () => Promise<void>;
  nextQuestion: () => Promise<void>;
  refreshAfterProfileReset: () => Promise<void>;
}

type CachedQuizCardState = {
  question: QuestionResponse | null;
  selectedOption: string | null;
  answerResult: AnswerResponse | null;
  skipResult: SkipResponse | null;
  hintResult: HintResponse | null;
  wrongSelections: string[];
  difficultySuggestion: Exclude<AdaptiveDifficultySuggestion, AdaptiveDifficultySuggestion.STAY> | null;
  liveInsightPoints: number | null;
};

type CachedQuizSessionState = CachedQuizCardState & {
  difficulty: DifficultyLevel;
  inputMode: QuizInputMode;
  questionDirection: QuestionDirection;
  questionScope: QuizContinentScope;
};

function toErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  return fallback;
}

function isMissingActiveQuestionError(cause: unknown): boolean {
  if (!(cause instanceof Error)) return false;
  return cause.message.includes('No active question found') || cause.message.includes('Fetch a new question first');
}

export function useQuiz(token: string): UseQuizResult {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const initialSession = queryClient.getQueryData<CachedQuizSessionState>(queryKeys.quizSession(token));
  const storedInputMode = readStoredInputMode();
  const storedQuestionDirection = readStoredQuestionDirection();
  const storedQuestionScope = readStoredQuestionScope();
  const [difficulty, setDifficultyState] = useState<DifficultyLevel>(() => initialSession?.difficulty ?? 1);
  const [inputMode, setInputModeState] = useState<QuizInputMode>(() => storedInputMode);
  const [questionDirection, setQuestionDirectionState] = useState<QuestionDirection>(() => storedQuestionDirection);
  const [questionScope, setQuestionScopeState] = useState<QuizContinentScope>(() => storedQuestionScope);
  const [question, setQuestion] = useState<QuestionResponse | null>(() => initialSession?.question ?? null);
  const [selectedOption, setSelectedOptionState] = useState<string | null>(() => initialSession?.selectedOption ?? null);
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(() => initialSession?.answerResult ?? null);
  const [skipResult, setSkipResult] = useState<SkipResponse | null>(() => initialSession?.skipResult ?? null);
  const [hintResult, setHintResult] = useState<HintResponse | null>(() => initialSession?.hintResult ?? null);
  const [wrongSelections, setWrongSelections] = useState<string[]>(() => initialSession?.wrongSelections ?? []);
  const [error, setError] = useState<QuizError>(null);
  const [difficultySuggestion, setDifficultySuggestion] = useState<Exclude<AdaptiveDifficultySuggestion, AdaptiveDifficultySuggestion.STAY> | null>(() => initialSession?.difficultySuggestion ?? null);
  const [liveInsightPoints, setLiveInsightPoints] = useState<number | null>(() => initialSession?.liveInsightPoints ?? null);
  const inputModeRef = useRef<QuizInputMode>(inputMode);
  const questionDirectionRef = useRef<QuestionDirection>(questionDirection);
  const questionScopeRef = useRef<QuizContinentScope>(questionScope);
  const hasMountedRef = useRef(false);

  const getQuizCardKey = useCallback(
    (difficultyLevel: DifficultyLevel, mode: QuizInputMode, direction: QuestionDirection, scope: QuizContinentScope) =>
      queryKeys.quizCard(token, difficultyLevel, mode, direction, scope),
    [token],
  );

  const readCachedQuizCard = useCallback(
    (difficultyLevel: DifficultyLevel, mode: QuizInputMode, direction: QuestionDirection, scope: QuizContinentScope) =>
      queryClient.getQueryData<CachedQuizCardState>(getQuizCardKey(difficultyLevel, mode, direction, scope)) ?? null,
    [getQuizCardKey, queryClient],
  );

  const statsQuery = useAnswerStatsQuery(token);
  const currentProgressQuery = useProgressForLevelQuery(token, difficulty);

  const fetchQuestionMutation = useMutation({
    mutationFn: ({ difficultyLevel, mode, direction, scope }: { difficultyLevel: DifficultyLevel; mode: QuizInputMode; direction: QuestionDirection; scope: QuizContinentScope }) =>
      apiClient.getQuestion(difficultyLevel, mode, direction, scope, token),
  });
  const fetchQuestionRef = useRef(fetchQuestionMutation.mutateAsync);

  const submitAnswerMutation = useMutation({
    mutationFn: (payload: { countryId: string; difficulty: DifficultyLevel; selectedOption: string }) =>
      apiClient.submitAnswer(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.progressRoot(token) });
    },
  });

  const skipQuestionMutation = useMutation({
    mutationFn: (payload: { countryId: string; difficulty: DifficultyLevel }) =>
      apiClient.skipQuestion(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.progressRoot(token) });
    },
  });

  const hintMutation = useMutation({
    mutationFn: (payload: { countryId: string; difficulty: DifficultyLevel }) =>
      apiClient.useHint(payload, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.progressRoot(token) });
    },
  });

  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  useEffect(() => {
    questionDirectionRef.current = questionDirection;
  }, [questionDirection]);

  useEffect(() => {
    questionScopeRef.current = questionScope;
  }, [questionScope]);

  useEffect(() => {
    fetchQuestionRef.current = fetchQuestionMutation.mutateAsync;
  }, [fetchQuestionMutation.mutateAsync]);

  const loadQuestion = useCallback(
    async (difficultyLevel: DifficultyLevel, mode: QuizInputMode, direction: QuestionDirection, scope: QuizContinentScope) => {
      setError(null);
      setQuestion(null);
      setSelectedOptionState(null);
      setAnswerResult(null);
      setSkipResult(null);
      setHintResult(null);
      setWrongSelections([]);
      setDifficultySuggestion(null);
      setLiveInsightPoints(null);

      try {
        const res = await fetchQuestionRef.current({ difficultyLevel, mode, direction, scope });
        setQuestion(res);
      } catch (cause) {
        setError(toErrorMessage(cause, t('common_unexpected_error')));
      }
    },
    [t],
  );

  const hydrateFromCachedCard = useCallback((cached: CachedQuizCardState) => {
    setError(null);
    setQuestion(cached.question);
    setSelectedOptionState(cached.selectedOption);
    setAnswerResult(cached.answerResult);
    setSkipResult(cached.skipResult);
    setHintResult(cached.hintResult);
    setWrongSelections(cached.wrongSelections);
    setDifficultySuggestion(cached.difficultySuggestion);
    setLiveInsightPoints(cached.liveInsightPoints);
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;

      const cached = readCachedQuizCard(difficulty, inputMode, questionDirection, questionScope);
      if (cached?.question) {
        hydrateFromCachedCard(cached);
        return;
      }
    }

    void loadQuestion(difficulty, inputMode, questionDirection, questionScope);
  }, [difficulty, hydrateFromCachedCard, inputMode, loadQuestion, questionDirection, questionScope, readCachedQuizCard]);

  useEffect(() => {
    if (!question) return;

    queryClient.setQueryData<CachedQuizCardState>(
      getQuizCardKey(difficulty, inputMode, questionDirection, questionScope),
      { question, selectedOption, answerResult, skipResult, hintResult, wrongSelections, difficultySuggestion, liveInsightPoints },
    );
  }, [
    answerResult,
    difficulty,
    difficultySuggestion,
    getQuizCardKey,
    hintResult,
    inputMode,
    liveInsightPoints,
    queryClient,
    question,
    questionDirection,
    questionScope,
    selectedOption,
    skipResult,
    wrongSelections,
  ]);

  useEffect(() => {
    queryClient.setQueryData<CachedQuizSessionState>(queryKeys.quizSession(token), {
      difficulty,
      inputMode,
      questionDirection,
      questionScope,
      question,
      selectedOption,
      answerResult,
      skipResult,
      hintResult,
      wrongSelections,
      difficultySuggestion,
      liveInsightPoints,
    });
  }, [
    answerResult,
    difficulty,
    difficultySuggestion,
    hintResult,
    inputMode,
    liveInsightPoints,
    queryClient,
    question,
    questionDirection,
    questionScope,
    selectedOption,
    skipResult,
    token,
    wrongSelections,
  ]);

  const setDifficulty = useCallback((nextDifficulty: DifficultyLevel) => {
    setDifficultyState(nextDifficulty);
  }, []);

  const setInputMode = useCallback((mode: QuizInputMode) => {
    setInputModeState(mode);
    writeStoredInputMode(mode);
  }, []);

  const setQuestionDirection = useCallback((direction: QuestionDirection) => {
    setQuestionDirectionState(direction);
    writeStoredQuestionDirection(direction);
  }, []);

  const setQuestionScope = useCallback((scope: QuizContinentScope) => {
    setQuestionScopeState(scope);
    writeStoredQuestionScope(scope);
  }, []);

  const setSelectedOption = useCallback(
    (option: string) => {
      if ((answerResult && answerResult.answerRevealed) || skipResult) return;
      if (question?.inputMode === QuizInputMode.MULTIPLE_CHOICE && wrongSelections.includes(option)) return;
      setSelectedOptionState(option);
    },
    [answerResult, question?.inputMode, skipResult, wrongSelections],
  );

  const submitAnswer = useCallback(async () => {
    if (!question || !selectedOption || skipResult) return;
    if (answerResult?.answerRevealed) return;

    setError(null);

    try {
      const res = await submitAnswerMutation.mutateAsync({ countryId: question.countryId, difficulty, selectedOption });
      setAnswerResult(res);
      setLiveInsightPoints(res.updatedInsightPoints);
      setDifficultySuggestion(res.difficultySuggestion);

      if (res.canRetry) {
        setWrongSelections(res.wrongSelections);
        setSelectedOptionState(null);
      }
    } catch (cause) {
      if (isMissingActiveQuestionError(cause)) {
        await loadQuestion(difficulty, inputModeRef.current, questionDirectionRef.current, questionScopeRef.current);
        return;
      }
      setError(toErrorMessage(cause, t('common_unexpected_error')));
    }
  }, [answerResult?.answerRevealed, difficulty, loadQuestion, question, selectedOption, skipResult, submitAnswerMutation, t]);

  const skipQuestion = useCallback(async () => {
    if (!question) return;

    setError(null);

    try {
      const res = await skipQuestionMutation.mutateAsync({ countryId: question.countryId, difficulty });
      setSkipResult(res);
      setLiveInsightPoints(res.updatedInsightPoints);
    } catch (cause) {
      if (isMissingActiveQuestionError(cause)) {
        await loadQuestion(difficulty, inputModeRef.current, questionDirectionRef.current, questionScopeRef.current);
        return;
      }
      setError(toErrorMessage(cause, t('common_unexpected_error')));
    }
  }, [difficulty, loadQuestion, question, skipQuestionMutation, t]);

  const useHint = useCallback(async () => {
    if (!question || skipResult || answerResult?.answerRevealed) return;

    setError(null);

    try {
      const res = await hintMutation.mutateAsync({ countryId: question.countryId, difficulty });
      setHintResult(res);
      setLiveInsightPoints(res.updatedInsightPoints);
      if (res.type === HintType.REMOVE_OPTION) {
        setQuestion({ ...question, options: res.remainingOptions });
        if (selectedOption && !res.remainingOptions.includes(selectedOption)) setSelectedOptionState(null);
      }
    } catch (cause) {
      if (isMissingActiveQuestionError(cause)) {
        await loadQuestion(difficulty, inputModeRef.current, questionDirectionRef.current, questionScopeRef.current);
        return;
      }
      setError(toErrorMessage(cause, t('common_unexpected_error')));
    }
  }, [answerResult?.answerRevealed, difficulty, hintMutation, loadQuestion, question, selectedOption, skipResult, t]);

  const nextQuestion = useCallback(async () => {
    await loadQuestion(difficulty, inputMode, questionDirection, questionScope);
  }, [difficulty, inputMode, loadQuestion, questionDirection, questionScope]);

  const refreshAfterProfileReset = useCallback(async () => {
    await queryClient.removeQueries({ queryKey: ['quiz', token, 'card'] });
    queryClient.removeQueries({ queryKey: queryKeys.quizSession(token) });
    setDifficultyState(1);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.progressRoot(token) }),
      loadQuestion(1, inputMode, questionDirection, questionScope),
    ]);
  }, [inputMode, loadQuestion, queryClient, questionDirection, questionScope, token]);

  const dismissDifficultySuggestion = useCallback(() => {
    setDifficultySuggestion(null);
  }, []);

  const submittingAnswer = submitAnswerMutation.isPending || skipQuestionMutation.isPending || hintMutation.isPending;
  const statsError = statsQuery.error instanceof Error ? statsQuery.error.message : null;
  const totalInsightPoints =
    liveInsightPoints ?? (typeof statsQuery.data?.totalInsightPoints === 'number' ? statsQuery.data.totalInsightPoints : null);

  return {
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
    wrongSelections,
    hintResult,
    currentProgress: currentProgressQuery.data ?? null,
    stats: statsQuery.data ?? null,
    totalInsightPoints,
    loadingStats: statsQuery.isLoading || statsQuery.isFetching || currentProgressQuery.isLoading || currentProgressQuery.isFetching,
    statsError,
    loadingQuestion: fetchQuestionMutation.isPending,
    submittingAnswer,
    usingHint: hintMutation.isPending,
    error,
    difficultySuggestion,
    dismissDifficultySuggestion,
    hasAnswered: Boolean(skipResult) || Boolean(answerResult?.answerRevealed),
    submitAnswer,
    skipQuestion,
    useHint,
    nextQuestion,
    refreshAfterProfileReset,
  };
}
