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
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "./common/Skeleton";
import { apiClient } from "@/lib/apiClient";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { queryKeys } from "@/lib/queryKeys";
import { useProfileQuery } from "@/hooks/useProfile";
import type { DailyChallengeAnswerResponse, UnlockedAchievement } from "@/lib/types";
import { topicConfig } from "@/lib/topic.config";
import { TranslationKey } from "@/lib/i18n";
import { parsePromptToken } from "@/lib/prompt-token";
import { MoreGamesSection } from "./MoreGamesSection";
import { AchievementUnlockedModal } from "@/components/AchievementUnlockedModal";

function toErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  return fallback;
}

export function DailyChallengePageContent() {
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const { t } = useI18n();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery(token);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<DailyChallengeAnswerResponse | null>(null);
  const [answeredItemId, setAnsweredItemId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

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
      setAnsweredItemId(question.itemId);
      if (res.unlockedAchievements?.length) setUnlockedAchievements((prev) => [...prev, ...res.unlockedAchievements]);
      await dailyChallengeQuery.refetch();
      setSelectedOption(null);
    } catch (cause) {
      setSubmitError(toErrorMessage(cause, t("common_unexpected_error")));
    }
  };


  const visibleAnswerResult = answerResult && question && answeredItemId === question.itemId ? answerResult : null;

  const dismissUnlockedAchievement = () => {
    setUnlockedAchievements((prev) => prev.slice(1));
  };

  const submitting = submitMutation.isPending;

  return (
    <section className="w-full space-y-4 sm:space-y-5">
      <DashboardHeader authMode={authMode} username={username} dailyStreak={profileQuery.data?.dailyStreak ?? 0} onLanguageChange={setPreferredLanguage} />

      <CardSection>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">{t("daily_challenge_title")}</p>
            <ScoreBadge scoreLabel={scoreLabel} />
          </div>
          <div className="flex gap-2">
            <RefreshButton loading={loading} submitting={submitting} onRefresh={() => void dailyChallengeQuery.refetch()} />
          </div>
        </div>

        {loading && !state && <DailyChallengeSkeleton />}
        {!loading && showOfflineFallback && <DailyChallengeSkeleton />}
        {showOfflineFallback && <OfflineStateHint className="mt-4" />}
        {error && <p className="mt-4 text-sm text-pastel-coral">{error}</p>}

        {state?.completed ? (
          <CompletionMessage correct={state.correctCount} total={state.questionCount} />
        ) : question ? (
          <div className="mt-5">
            <QuestionProgress current={currentQuestionNumber} total={totalQuestions} />
            <h2 className="mt-2 text-xl font-semibold text-ink-100 sm:text-2xl">
              {(() => {
                const token = parsePromptToken(String(question.prompt));
                if (token) return t(token.key as TranslationKey, token.params);
                return t("question_prompt", {
                  value: question.publicFields[topicConfig.publicFields.displayName] as string,
                  promptNoun: t(`${topicConfig.slug}_prompt_noun` as TranslationKey)
                });
              })()}
            </h2>
            <p className="mt-1 text-xs text-ink-400">{t("difficulty_level", { level: question.difficulty })}</p>
            <QuestionOptions options={question.options} selectedOption={selectedOption} submitting={submitting} onSelect={setSelectedOption} />
            <AnswerFeedback answerResult={visibleAnswerResult} />
            <div className="mt-5">
              <Button type="button" variant="primary" disabled={!selectedOption || submitting} onClick={() => void submit()}>
                {submitting ? <LoadingSpinner size="sm" /> : t("question_submit")}
              </Button>
            </div>
          </div>
        ) : null}
      </CardSection>

      <MoreGamesSection />

      <AchievementUnlockedModal achievement={unlockedAchievements[0] ?? null} onClose={dismissUnlockedAchievement} />
    </section>
  );
}

function DailyChallengeSkeleton() {
  return (
    <div className="mt-5" aria-busy="true">
      <SkeletonText className="w-32" />
      <SkeletonBlock className="mt-3 h-7 w-11/12" />
      <SkeletonText className="mt-2 w-24" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-12 rounded-xl" />)}
      </div>
      <SkeletonBlock className="mt-5 h-11 w-32" />
    </div>
  );
}

function ScoreBadge({ scoreLabel }: { scoreLabel: string }) {
  const { t } = useI18n();
  return (
    <p className="mt-2 inline-flex rounded-lg border border-accent-greenDim/50 bg-accent-green/10 px-2.5 py-1 text-xs font-medium text-accent-green">
      {t("daily_challenge_score", { score: scoreLabel })}
    </p>
  );
}

function RefreshButton({ loading, submitting, onRefresh }: { loading: boolean; submitting: boolean; onRefresh: () => void }) {
  const { t } = useI18n();
  
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={loading || submitting}
      aria-label={t("common_refresh")}
      title={t("common_refresh")}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-greenDim/45 bg-accent-green/10 p-0 leading-none text-accent-green"
    >
      <RefreshIcon spinning={loading || submitting} />
    </Button>
  );
}

function CompletionMessage({ correct, total }: { correct: number; total: number }) {
  const { t } = useI18n();
  
  const getScoreColor = (correct: number, total: number) => {
    if (total === 0) return "border-pastel-mint/40 bg-pastel-mint/10 text-pastel-mint";
    const percentage = (correct / total) * 100;
    if (percentage <= 33) return "border-pastel-coral/40 bg-pastel-coral/10 text-pastel-coral";
    if (percentage <= 66) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-500";
    return "border-pastel-mint/40 bg-pastel-mint/10 text-pastel-mint";
  };

  return (
    <div className={["mt-5 rounded-xl border p-4 text-sm", getScoreColor(correct, total)].join(" ")}>
      {t("daily_challenge_completed", { correct, total })}
    </div>
  );
}

function QuestionProgress({ current, total }: { current: number; total: number }) {
  const { t } = useI18n();
  
  return (
    <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
      {t("daily_challenge_question_progress", { current, total })}
    </p>
  );
}

function QuestionOptions({ options, selectedOption, submitting, onSelect }: { 
  options: string[]; 
  selectedOption: string | null; 
  submitting: boolean; 
  onSelect: (option: string) => void;
}) {
  const { t } = useI18n();
  const noneOfAboveLabel = t("question_none_of_the_above");

  // Localize an option value that may be an i18n key (e.g. mapper-emitted enum values
  // like planets_value_color_brown_white). Returns the raw value if no key matches.
  const localizeOption = (value: string): string => {
    const resolved = t(value as TranslationKey);
    return resolved && resolved !== value ? resolved : value;
  };
  
  return (
    <div className="mt-4 space-y-2">
      {options.map((option) => {
        const selected = selectedOption === option;
        const isNoneOfAbove = option === noneOfAboveLabel;

        return (
          <Button
            key={option}
            type="button"
            variant={selected ? "dailyOptionSelected" : "dailyOptionIdle"}
            size="lg"
            onClick={() => onSelect(option)}
            disabled={submitting}
            className={[
              "w-full text-left font-normal",
              isNoneOfAbove && !selected ? "border-dashed border-[1.5px] bg-base-700/85 text-ink-200" : "",
              isNoneOfAbove && selected ? "border-solid border-[1.5px] bg-accent-green/10 text-accent-green" : ""
            ].join(" ")}
          >
            {localizeOption(option)}
          </Button>
        );
      })}
    </div>
  );
}

function AnswerFeedback({ answerResult }: { answerResult: DailyChallengeAnswerResponse | null }) {
  const { t } = useI18n();
  if (!answerResult) return null;

  const localizeOption = (value: string): string => {
    const resolved = t(value as TranslationKey);
    return resolved && resolved !== value ? resolved : value;
  };

  return (
    <p className={["mt-4 text-sm", answerResult.correct ? "text-pastel-mint" : "text-pastel-coral"].join(" ")}>
      {answerResult.correct ? t("daily_challenge_answer_correct") : t("daily_challenge_answer_wrong", { answer: localizeOption(answerResult.correctAnswer) })}
    </p>
  );
}