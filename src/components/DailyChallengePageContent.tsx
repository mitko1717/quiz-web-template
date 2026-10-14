"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/components/AuthGate";
import { useI18n } from "@/components/I18nProvider";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CardSection } from "@/components/types/CardSection";
import { Button } from "@/components/button";
import { ArrowRightIcon, CheckIcon, StarIcon } from "@/components/icons";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "./common/Skeleton";
import { AnswerOption } from "./AnswerOption";
import { QuestionImage } from "./QuestionImage";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useProfileQuery, useNetworkStatus, useReferralLink } from "@/hooks";
import { parsePromptToken, topicConfig, TranslationKey, Topic, type DailyChallengeAnswerResponse, type UnlockedAchievement, shareViaTelegram } from "@/lib";
import { MoreGamesSection } from "./MoreGamesSection";
import { AchievementUnlockedModal } from "@/components/AchievementUnlockedModal";

function toErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  return fallback;
}

export function DailyChallengePageContent() {
  const { token, authMode, username, setPreferredLanguage } = useAuthContext();
  const { t, language } = useI18n();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery(token);
  const referralLink = useReferralLink(profileQuery.data);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<DailyChallengeAnswerResponse | null>(null);
  const [answeredItemId, setAnsweredItemId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [advancing, setAdvancing] = useState(false);

  const dailyChallengeQuery = useQuery({
    queryKey: [...queryKeys.dailyChallenge(token), language],
    queryFn: () => apiClient.getDailyChallenge(token, language),
    enabled: Boolean(token),
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { itemId: string; selectedOption: string }) => apiClient.submitDailyChallengeAnswer(payload, token, language),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.progressRoot(token) });
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

  const isFlagsTopic = topicConfig.slug === Topic.Flags;
  const badge = question && topicConfig.publicFields.badge ? ((question.publicFields?.[topicConfig.publicFields.badge] as string) ?? null) : null;

  // Only valid for the item it was generated from — prevents a stale banner (e.g.
  // "Correct answer: X" from a previous question) from bleeding onto the next one.
  const visibleAnswerResult = answerResult && question && answeredItemId === question.itemId ? answerResult : null;
  const hasAnswered = visibleAnswerResult !== null;

  const submit = async () => {
    if (!question || !selectedOption) return;
    setSubmitError(null);
    try {
      const res = await submitMutation.mutateAsync({ itemId: question.itemId, selectedOption });
      // Don't advance yet — hold on this question so the person can actually read the
      // feedback (correct/wrong + correct answer) before moving on, same as the regular
      // quiz screen's "Next question" step.
      setAnswerResult(res);
      setAnsweredItemId(question.itemId);
      if (res.unlockedAchievements?.length) setUnlockedAchievements((prev) => [...prev, ...res.unlockedAchievements]);
    } catch (cause) {
      setSubmitError(toErrorMessage(cause, t("common_unexpected_error")));
    }
  };

  const advanceToNext = async () => {
    setAdvancing(true);
    try {
      await dailyChallengeQuery.refetch();
      setSelectedOption(null);
      setAnswerResult(null);
      setAnsweredItemId(null);
    } finally {
      setAdvancing(false);
    }
  };

  const dismissUnlockedAchievement = () => {
    setUnlockedAchievements((prev) => prev.slice(1));
  };

  const submitting = submitMutation.isPending;
  const resultState = visibleAnswerResult ? (visibleAnswerResult.correct ? "correct" : "wrong") : null;

  return (
    <section className="w-full space-y-2.5 sm:space-y-3">
      <DashboardHeader authMode={authMode} username={username} dailyStreak={profileQuery.data?.dailyStreak ?? 0} onLanguageChange={setPreferredLanguage} />

      <CardSection resultState={resultState}>
        {loading && !state && <DailyChallengeSkeleton />}
        {!loading && showOfflineFallback && <DailyChallengeSkeleton />}
        {showOfflineFallback && <OfflineStateHint className="mt-4" />}
        {error && <p className="mt-4 text-sm text-pastel-coral">{error}</p>}

        {state?.completed ? (
          <CompletionMessage correct={state.correctCount} total={state.questionCount} scoreLabel={scoreLabel} referralLink={referralLink} />
        ) : question ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <QuestionProgress current={currentQuestionNumber} total={totalQuestions} />
              <ScoreBadge scoreLabel={scoreLabel} />
            </div>
            <ProgressSegments done={currentQuestionNumber - 1 + (hasAnswered ? 1 : 0)} current={currentQuestionNumber} total={totalQuestions} />
            <QuestionImage key={question.itemId} publicFields={question.publicFields} className="mt-3" />

            {isFlagsTopic && badge ? (
              <div className="mt-3 text-6xl leading-none sm:text-7xl" style={{ lineHeight: 0.8 }} aria-hidden="true">
                {badge}
              </div>
            ) : null}
            <h2 className="mt-3 break-words text-lg font-semibold leading-snug text-ink-100 sm:text-2xl">
              {(() => {
                const promptToken = parsePromptToken(String(question.prompt));
                if (promptToken) return t(promptToken.key as TranslationKey, promptToken.params);
                return t("question_prompt", {
                  value: question.publicFields[topicConfig.publicFields.displayName] as string,
                  promptNoun: t(`${topicConfig.slug}_prompt_noun` as TranslationKey)
                });
              })()}
            </h2>
            <span className="mt-1.5 inline-flex rounded-full bg-base-700/60 px-2 py-0.5 text-[11px] font-medium text-ink-300">
              {t("difficulty_level", { level: question.difficulty })}
            </span>

            <QuestionOptions
              options={question.options}
              selectedOption={selectedOption}
              submitting={submitting}
              hasAnswered={hasAnswered}
              answerResult={visibleAnswerResult}
              onSelect={setSelectedOption}
            />

            <div className="mt-3">
              {hasAnswered ? (
                <Button className="flex w-full items-center justify-center gap-2" type="button" variant="primary" disabled={advancing} onClick={() => void advanceToNext()}>
                  {advancing ? <LoadingSpinner size="sm" /> : (
                    <>
                      {t("question_next")}
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button className="w-full" type="button" variant="primary" disabled={!selectedOption || submitting} onClick={() => void submit()}>
                  {submitting ? <LoadingSpinner size="sm" /> : t("question_submit")}
                </Button>
              )}
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
    <div aria-busy="true">
      <SkeletonText className="w-32" />
      <SkeletonBlock className="mt-2 h-1 w-full" />
      <SkeletonBlock className="mt-4 h-7 w-11/12" />
      <SkeletonText className="mt-2 w-20" />
      <div className="mt-3 space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} className="h-11 rounded-xl" />)}
      </div>
      <SkeletonBlock className="mt-3 h-11 w-full rounded-xl" />
    </div>
  );
}

function ScoreBadge({ scoreLabel }: { scoreLabel: string }) {
  const { t } = useI18n();
  const label = t("daily_challenge_score", { score: scoreLabel });
  return (
    <p
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pastel-mint/12 px-2.5 py-1 text-xs font-semibold tabular-nums text-pastel-mint"
    >
      <CheckIcon className="h-3.5 w-3.5" />
      {scoreLabel}
    </p>
  );
}

function ProgressSegments({ done, current, total }: { done: number; current: number; total: number }) {
  if (total <= 0) return null;

  return (
    <div className="mt-2 flex gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={[
            "h-1 flex-1 rounded-full transition-colors duration-300",
            i < done
              ? "bg-accent-green shadow-[0_0_6px_color-mix(in_srgb,var(--color-accent-green)_50%,transparent)]"
              : i === current - 1
                ? "bg-accent-green/40"
                : "bg-base-600/70",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

function CompletionMessage({ correct, total, scoreLabel, referralLink }: { correct: number; total: number; scoreLabel: string; referralLink: string | null }) {
  const { t } = useI18n();
  const isPerfect = total > 0 && correct === total;
  const percentage = total > 0 ? (correct / total) * 100 : 100;

  const tone =
    percentage <= 33
      ? { text: "text-pastel-coral", bg: "bg-pastel-coral/15", glow: "shadow-[0_0_24px_color-mix(in_srgb,var(--color-pastel-coral)_35%,transparent)]" }
      : percentage <= 66
        ? { text: "text-pastel-amber", bg: "bg-pastel-amber/15", glow: "shadow-[0_0_24px_color-mix(in_srgb,var(--color-pastel-amber)_35%,transparent)]" }
        : { text: "text-pastel-mint", bg: "bg-pastel-mint/15", glow: "shadow-[0_0_24px_color-mix(in_srgb,var(--color-pastel-mint)_35%,transparent)]" };

  const handleShare = async () => {
    if (!referralLink) return;
    const text = t('share_hook_daily_perfect', { total, appName: topicConfig.appName, link: referralLink });
    await shareViaTelegram(text);
  };

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className={["flex h-16 w-16 items-center justify-center rounded-2xl", tone.bg, tone.text, tone.glow].join(" ")}>
        <StarIcon className="h-8 w-8" />
      </span>
      <p className={["mt-3 text-3xl font-bold tabular-nums", tone.text].join(" ")}>{scoreLabel}</p>
      <p className="mt-1 text-sm text-ink-300">{t("daily_challenge_completed", { correct, total })}</p>
      {isPerfect ? (
        <Button
          type="button"
          variant="primary"
          className="mt-4 w-full"
          onClick={() => void handleShare()}
          disabled={!referralLink}
        >
          {t("share_button")}
        </Button>
      ) : null}
    </div>
  );
}

function QuestionProgress({ current, total }: { current: number; total: number }) {
  const { t } = useI18n();

  return (
    <p className="text-xs font-medium text-ink-500">
      {t("daily_challenge_question_progress", { current, total })}
    </p>
  );
}

function QuestionOptions({ options, selectedOption, submitting, hasAnswered, answerResult, onSelect }: {
  options: string[];
  selectedOption: string | null;
  submitting: boolean;
  hasAnswered: boolean;
  answerResult: DailyChallengeAnswerResponse | null;
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
    <div className="mt-3 space-y-1.5">
      {options.map((option) => {
        const selected = selectedOption === option;
        const isCorrectAnswer = hasAnswered && option === answerResult?.correctAnswer;
        const isWrongSelection = hasAnswered && selected && answerResult ? !answerResult.correct : false;

        return (
          <AnswerOption
            key={option}
            label={localizeOption(option)}
            selected={selected}
            locked={submitting || hasAnswered}
            triedWrong={false}
            isCorrectAnswer={Boolean(isCorrectAnswer)}
            isWrongSelection={isWrongSelection}
            isNoneOfAbove={option === noneOfAboveLabel}
            onSelect={() => onSelect(option)}
          />
        );
      })}
    </div>
  );
}
