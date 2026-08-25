"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/components/AuthGate";
import { useI18n } from "@/components/I18nProvider";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CardSection } from "@/components/CardSection";
import { Button } from "@/components/button";
import { RefreshIcon } from "@/components/icons/RefreshIcon";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "@/components/Skeleton";
import { apiClient } from "@/lib/apiClient";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { queryKeys } from "@/lib/queryKeys";
import { useProfileQuery } from "@/hooks/useProfile";
import type { DailyChallengeAnswerResponse } from "@/lib/types";
import { topicConfig } from "@/lib/topic.config";
import { TranslationKey } from "@/lib/i18n";

function toErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  return fallback;
}

function DailyChallengeSkeleton() {
  return (
    <div className="mt-5" aria-busy="true">
      <SkeletonText className="w-32" />
      <SkeletonBlock className="mt-3 h-7 w-11/12" />
      <SkeletonText className="mt-2 w-24" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-12 rounded-xl" />)}
      </div>
      <SkeletonBlock className="mt-5 h-11 w-32" />
    </div>
  );
}

export function DailyChallengePageContent() {
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const { t } = useI18n();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery(token);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<DailyChallengeAnswerResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dailyChallengeQuery = useQuery({
    queryKey: queryKeys.dailyChallenge(token),
    queryFn: () => apiClient.getDailyChallenge(token),
    enabled: Boolean(token),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { itemId: string; selectedOption: string }) => apiClient.submitDailyChallengeAnswer(payload, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dailyChallenge(token) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.progressRoot(token) }),
      ]);
    },
  });

  const state = dailyChallengeQuery.data ?? null;
  const loading = dailyChallengeQuery.isLoading || dailyChallengeQuery.isFetching;
  const showOfflineFallback = !isOnline && !state && (loading || Boolean(dailyChallengeQuery.error));
  const queryError = dailyChallengeQuery.error ? toErrorMessage(dailyChallengeQuery.error, t("common_unexpected_error")) : null;
  const error = showOfflineFallback ? submitError : (queryError ?? submitError);
  const question = state?.currentQuestion ?? null;
  const currentQuestionNumber = (state?.currentQuestionIndex ?? 0) + 1;
  const totalQuestions = state?.questionCount ?? 0;
  const scoreLabel = useMemo(() => {
    if (!state) return "0/0";
    return `${state.correctCount}/${state.questionCount}`;
  }, [state]);

  const submit = async () => {
    if (!question || !selectedOption) return;

    setSubmitError(null);
    try {
      const res = await submitMutation.mutateAsync({ itemId: question.itemId, selectedOption });
      setAnswerResult(res);
      await dailyChallengeQuery.refetch();
      setSelectedOption(null);
    } catch (cause) {
      setSubmitError(toErrorMessage(cause, t("common_unexpected_error")));
    }
  };

  const submitting = submitMutation.isPending;

  return (
    <section className="w-full space-y-4 sm:space-y-5">
      <DashboardHeader
        authMode={authMode}
        username={username}
        dailyStreak={profileQuery.data?.dailyStreak ?? 0}
        onLanguageChange={setPreferredLanguage}
      />

      <CardSection>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">{t("daily_challenge_title")}</p>
            <p className="mt-2 inline-flex rounded-lg border border-accent-greenDim/50 bg-accent-green/10 px-2.5 py-1 text-xs font-medium text-accent-green">
              {t("daily_challenge_score", { score: scoreLabel })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void dailyChallengeQuery.refetch()}
              disabled={loading || submitting}
              aria-label={t("common_refresh")}
              title={t("common_refresh")}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-greenDim/45 bg-accent-green/10 p-0 leading-none text-accent-green"
            >
              <RefreshIcon spinning={loading || submitting} />
            </Button>
          </div>
        </div>

        {loading && !state ? <DailyChallengeSkeleton /> : null}
        {!loading && showOfflineFallback ? <DailyChallengeSkeleton /> : null}
        {showOfflineFallback ? <OfflineStateHint className="mt-4" /> : null}
        {error ? <p className="mt-4 text-sm text-pastel-coral">{error}</p> : null}

        {state?.completed ? (
          <div className="mt-5 rounded-xl border border-pastel-mint/40 bg-pastel-mint/10 p-4 text-sm text-pastel-mint">
            {t("daily_challenge_completed", { correct: state.correctCount, total: state.questionCount })}
          </div>
        ) : question ? (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
              {t("daily_challenge_question_progress", { current: currentQuestionNumber, total: totalQuestions })}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-ink-100 sm:text-2xl">
              {t("question_prompt", { value: question.publicFields[topicConfig.publicFields.displayName] as string, promptNoun: t(`${topicConfig.slug}_prompt_noun` as TranslationKey) })}
            </h2>
            <p className="mt-1 text-xs text-ink-400">{t("difficulty_level", { level: question.difficulty })}</p>

            <div className="mt-4 space-y-2">
              {question.options.map((option) => {
                const selected = selectedOption === option;
                const isNoneOfAbove = option === t("question_none_of_the_above");
                return (
                  <Button
                    key={option}
                    type="button"
                    variant={selected ? "dailyOptionSelected" : "dailyOptionIdle"}
                    size="lg"
                    onClick={() => setSelectedOption(option)}
                    disabled={submitting}
                    className={[
                      "w-full text-left font-normal",
                      isNoneOfAbove ? "border-dashed border-[1.5px] bg-base-700/85 text-ink-200" : ""
                    ].join(" ")}
                  >
                    {option}
                  </Button>
                );
              })}
            </div>

            {answerResult ? (
              <p className={["mt-4 text-sm", answerResult.correct ? "text-pastel-mint" : "text-pastel-coral"].join(" ")}>
                {answerResult.correct
                  ? t("daily_challenge_answer_correct")
                  : t("daily_challenge_answer_wrong", { answer: answerResult.correctAnswer })}
              </p>
            ) : null}

            <div className="mt-5">
              <Button type="button" variant="primary" disabled={!selectedOption || submitting} onClick={() => void submit()}>
                {submitting ? <LoadingSpinner size="sm" /> : t("question_submit")}
              </Button>
            </div>
          </div>
        ) : null}
      </CardSection>
    </section>
  );
}
