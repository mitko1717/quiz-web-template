"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { HintButton } from "@/components/HintButton";
import { ModeIcon } from "@/components/icons/ModeIcon";
import { Input } from "@/components/input";
import { Modal } from "@/components/common/Modal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OfflineStateHint } from "@/components/common/Skeleton";
import { AnswerOption } from "./AnswerOption";
import { CardSection } from "./CardSection";
import { useI18n } from "@/components/I18nProvider";
import { HintType, QuestionDirection, QuizInputMode, type UnlockedAchievement } from "@/lib/types";
import { QuizModeControls } from "@/components/QuizModeControls";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { AchievementUnlockedModal } from "@/components/AchievementUnlockedModal";
import type {
  ActionRowProps,
  AnswerOptionsListProps,
  ErrorNoticeProps,
  FreeTextAnswerInputProps,
  HintModalProps,
  HintNoticeProps,
  HintTriggerProps,
  ModeModalProps,
  ModeTriggerProps,
  QuestionCardProps,
  QuestionHeadingProps,
  ResultNoticeProps
} from "./QuestionCard.types";
import { topicConfig } from "@/lib/topic.config";
import { TranslationKey } from "@/lib/i18n";
import { parsePromptToken } from "@/lib/prompt-token";

function LoadingState({ inputMode }: { inputMode: QuizInputMode }) {
  const optionRowTones = inputMode === QuizInputMode.FREE_TEXT ? ["bg-base-700/70", "bg-base-700/35", "bg-base-700/25"] : Array(4).fill("bg-base-700/70");

  return (
    <div className="rounded-xl border border-base-600 bg-base-700/30 p-2 sm:p-2.5" aria-busy="true">
      <div className="animate-pulse space-y-2.5" aria-hidden="true">
        <div className="space-y-1">
          <div className="h-3 w-20 rounded-full bg-ink-500/35" />
          <div className="h-4 w-10/12 rounded-full bg-base-600/80" />
        </div>
        <div className="space-y-1 sm:space-y-1.5">
          {optionRowTones.map((tone, i) => <div key={`${tone}-${i}`} className={["h-9 rounded-xl border border-base-600 sm:h-10", tone].join(" ")} />)}
        </div>
      </div>
    </div>
  );
}

function QuestionContentFrame({ children }: { children: React.ReactNode }) {
  return <div className="question-content-frame">{children}</div>;
}

function HintTrigger({ disabled, pending, hasResult, onOpen }: HintTriggerProps) {
  const { t } = useI18n();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t('question_hint_open')}
      title={t('question_hint_open')}
      disabled={disabled}
      onClick={onOpen}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-full p-0 text-lg",
        hasResult ? "border-pastel-amber/70 bg-pastel-amber/15 text-pastel-amber" : "border-pastel-amber/45 text-pastel-amber"
      ].join(" ")}
    >
      <span aria-hidden="true">{pending ? "..." : "?"}</span>
    </Button>
  );
}

function ModeTrigger({ disabled, onOpen, scopeLabel }: ModeTriggerProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-flex h-8 items-center rounded-full border border-accent-greenDim/50 bg-accent-green/10 px-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-accent-green"
        title={t('question_scope_chip_label', { scope: scopeLabel })}
      >
        {scopeLabel}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('question_mode_open')}
        title={t('question_mode_open')}
        disabled={disabled}
        onClick={onOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full border-accent-greenDim/60 p-0 text-sm text-accent-green"
      >
        <ModeIcon />
      </Button>
    </div>
  );
}

function QuestionHeading({ question, actions }: QuestionHeadingProps) {
  const { t } = useI18n();
  const displayName = (question.publicFields?.[topicConfig.publicFields.displayName] as string) ?? '';
  const badge = topicConfig.publicFields.badge ? ((question.publicFields?.[topicConfig.publicFields.badge] as string) ?? null) : null;

  const answerNoun = t(`${topicConfig.slug}_answer_noun` as TranslationKey);
  const promptNoun = t(`${topicConfig.slug}_prompt_noun` as TranslationKey);

  // Localize a prompt token that may be an i18n key. Returns the raw token if no key matches.
  const localizeToken = (token: string): string => {
    const resolved = t(token as TranslationKey);
    return resolved && resolved !== token ? resolved : token;
  };

  let prompt: string;
  if (question.questionDirection === QuestionDirection.REVERSE) {
    const reverseToken = parsePromptToken(String(question.prompt));
    if (reverseToken) {
      prompt = t(reverseToken.key as TranslationKey, reverseToken.params);
    } else {
      // Reverse prompt may be "labelKey|answerValue" (legacy variant topics) or a plain value.
      const [maybeLabel, maybeValue] = String(question.prompt).split('|');
      const value = maybeValue !== undefined ? `${localizeToken(maybeLabel)}: ${maybeValue}` : question.prompt;
      prompt = t('question_prompt_reverse', { value, answerNoun, promptNoun });
    }
  } else {
    const forwardToken = parsePromptToken(String(question.prompt));
    if (forwardToken) {
      prompt = t(forwardToken.key as TranslationKey, forwardToken.params);
    } else {
      const localizedLabel = localizeToken(String(question.prompt));
      const promptValue = localizedLabel !== String(question.prompt) ? `${displayName} · ${localizedLabel}` : displayName;
      prompt = t('question_prompt', { value: promptValue, promptNoun });
    }
  }

  return (
    <div className="mb-2 grid grid-cols-[minmax(0,3fr)_auto] items-start gap-2 sm:mb-4 sm:gap-3">
      <div className="min-w-0">
        <h2 className="break-words text-lg font-semibold leading-snug text-ink-100 sm:mt-1 sm:text-2xl">
          {prompt}
          {badge ? <span className="ml-2 inline-block align-middle" aria-hidden="true">{badge}</span> : null}
        </h2>
      </div>
      {actions ? <div className="flex shrink-0 justify-end gap-2">{actions}</div> : null}
    </div>
  );
}

function FreeTextAnswerInput({ selectedOption, hasAnswered, submittingAnswer, questionDirection, onSelectOption }: FreeTextAnswerInputProps) {
  const { t } = useI18n();
  const placeholder = questionDirection === QuestionDirection.REVERSE
    ? t('question_free_text_placeholder_reverse', { noun: t(`${topicConfig.slug}_answer_noun` as TranslationKey) })
    : t('question_free_text_placeholder', { noun: t(`${topicConfig.slug}_prompt_noun` as TranslationKey) });

  return (
    <div className="mb-3">
      <Input
        value={selectedOption ?? ''}
        onChange={(event) => onSelectOption(event.target.value)}
        placeholder={placeholder}
        disabled={hasAnswered || submittingAnswer}
        className="w-full"
      />
    </div>
  );
}

function AnswerOptionsList({ question, selectedOption, hasAnswered, submittingAnswer, skipResult, answerResult, wrongSelections, onSelectOption }: AnswerOptionsListProps) {
  const { t } = useI18n();
  const noneOfAboveLabel = t('question_none_of_the_above');

  // Localize an option value that may be an i18n key (e.g. mapper-emitted enum values
  // like planets_value_type_terrestrial). Returns the raw value if no key matches.
  const localizeOption = (value: string): string => {
    const resolved = t(value as TranslationKey);
    return resolved && resolved !== value ? resolved : value;
  };

  const sortedOptions = [...question.options].sort((a, b) => {
    if (a === noneOfAboveLabel) return 1;
    if (b === noneOfAboveLabel) return -1;
    return 0;
  });

  return (
    <div className="min-w-0 space-y-1 sm:space-y-1.5">
      {sortedOptions.map((option) => {
        const isSelected = selectedOption === option;
        const isCorrectAnswer = hasAnswered && option === (skipResult?.correctAnswer ?? answerResult?.correctAnswer);
        const isWrongSelection = hasAnswered && isSelected && (answerResult ? !answerResult.correct : false);
        const triedWrong = wrongSelections.includes(option);
        const isNoneOfAbove = option === noneOfAboveLabel;

        return (
          <AnswerOption
            key={option}
            label={localizeOption(option)}
            selected={isSelected}
            locked={hasAnswered || submittingAnswer || triedWrong}
            triedWrong={triedWrong}
            isCorrectAnswer={Boolean(isCorrectAnswer)}
            isWrongSelection={Boolean(isWrongSelection)}
            isNoneOfAbove={isNoneOfAbove}
            onSelect={() => onSelectOption(option)}
          />
        );
      })}
    </div>
  );
}

function ResultNotice({ answerResult, skipResult, hasAnswered }: ResultNoticeProps) {
  const { t } = useI18n();
  if (!hasAnswered || (!answerResult && !skipResult)) return null;
  if (!skipResult && !answerResult?.freeTextBonusInsightPointsAwarded) return null;

  const statusTone = skipResult ? "border-pastel-coral/40 bg-pastel-coral/10 text-pastel-coral" : "border-pastel-mint/40 bg-pastel-mint/10 text-pastel-mint";

  return (
    <div className={["mt-3 rounded-xl border p-1.5 text-sm sm:mt-5", statusTone].join(" ")}>
      {skipResult ? t('question_result_skipped', { answer: skipResult.correctAnswer }) : null}
      {answerResult?.correct && answerResult.freeTextBonusInsightPointsAwarded > 0 ? (
        <p className="mt-1 text-xs text-ink-100">
          {t('question_free_text_bonus', {
            points: answerResult.freeTextBonusInsightPointsAwarded,
            plural: answerResult.freeTextBonusInsightPointsAwarded === 1 ? '' : 's'
          })}
        </p>
      ) : null}
    </div>
  );
}

function HintNotice({ hintResult }: HintNoticeProps) {
  const { t } = useI18n();
  if (!hintResult) return null;

  const costText = hintResult.usedFreeHint ? t('question_hint_free_used') : t('question_hint_points_spent', { points: hintResult.insightPointsSpent });

  return (
    <div className="mt-4 rounded-xl border border-pastel-amber/45 bg-pastel-amber/10 p-3 text-sm text-ink-200">
      <p className="font-semibold text-pastel-amber">
        {hintResult.type === HintType.REMOVE_OPTION ? t('question_hint_removed_option') : t('question_hint_text_clue')}
      </p>
      {hintResult.type === HintType.TEXT_CLUE ? (
        <p className="mt-2 text-ink-100">{hintResult.clue}</p>
      ) : null}
      <p className="mt-2 text-xs text-ink-300">{costText}</p>
    </div>
  );
}

function HintModal({ isOpen, onClose, difficulty, currentProgress, loadingStats, hintDisabled, usingHint, hintResult, onUseHint }: HintModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t('common_dismiss')}
      title={t('question_hint_title')}
      maxWidthClassName="max-w-lg"
      footer={(
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>{hintResult ? t('question_hint_thanks') : t('common_dismiss')}</Button>
        </div>
      )}
    >
      <div className="space-y-3">
        <HintButton
          difficulty={difficulty}
          progress={currentProgress}
          loadingProgress={loadingStats}
          disabled={hintDisabled}
          pending={usingHint}
          onUseHint={onUseHint}
        />
        <HintNotice hintResult={hintResult} />
      </div>
    </Modal>
  );
}

function ModeModal(props: ModeModalProps) {
  const { isOpen, onClose, inputMode, questionDirection, questionScope, loadingQuestion, submittingAnswer, allowReverseMode, onInputModeChange, onQuestionDirectionChange, onQuestionScopeChange } = props;
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeLabel={t('common_dismiss')}
      title={t('question_mode_title')}
      description={t('question_mode_desc')}
      maxWidthClassName="max-w-lg"
      footer={(
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>{t('common_dismiss')}</Button>
        </div>
      )}
    >
      <QuizModeControls
        inputMode={inputMode}
        questionDirection={questionDirection}
        questionScope={questionScope}
        disabled={loadingQuestion || submittingAnswer}
        allowReverseMode={allowReverseMode}
        onInputModeChange={onInputModeChange}
        onQuestionDirectionChange={onQuestionDirectionChange}
        onQuestionScopeChange={onQuestionScopeChange}
      />
    </Modal>
  );
}

function ErrorNotice({ error }: ErrorNoticeProps) {
  return (
    <div className="mt-3 rounded-xl border border-pastel-coral/50 bg-pastel-coral/10 p-2.5 text-sm text-pastel-coral sm:mt-5 sm:p-3">
      {error}
    </div>
  );
}

function ActionRow({ hasAnswered, submittingAnswer, submitDisabled, skipDisabled, nextDisabled, onSubmitAnswer, onSkipQuestion, onNextQuestion }: ActionRowProps) {
  const { t } = useI18n();
  return (
    <div className="mt-1.5 rounded-xl border-0 bg-transparent p-0 md:mt-0 md:border md:border-base-600 md:bg-base-700/25 md:p-3">
      {!hasAnswered ? (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <Button className="w-full" type="button" onClick={() => void onSubmitAnswer()} disabled={submitDisabled} variant="primary">
            {submittingAnswer ? <LoadingSpinner size="sm" /> : t('question_submit')}
          </Button>
          <Button className="w-full" type="button" onClick={() => void onSkipQuestion()} disabled={skipDisabled} variant="secondary">
            {t('question_skip')}
          </Button>
        </div>
      ) : (
        <Button className="w-full" type="button" onClick={() => void onNextQuestion()} disabled={nextDisabled} variant="primary">
          {t('question_next')}
        </Button>
      )}
    </div>
  );
}

export function QuestionCard({
  question,
  loadingQuestion,
  submittingAnswer,
  selectedOption,
  answerResult,
  skipResult,
  hintResult,
  currentProgress,
  wrongSelections,
  loadingStats,
  usingHint,
  error,
  onSelectOption,
  onSubmitAnswer,
  onSkipQuestion,
  onUseHint,
  onNextQuestion,
  inputMode,
  onInputModeChange,
  questionDirection,
  onQuestionDirectionChange,
  questionScope,
  onQuestionScopeChange,
  allowReverseMode,
  unlockedAchievements,
  onDismissAchievement,
}: QuestionCardProps) {
  const { t } = useI18n();
  const { isOnline } = useNetworkStatus();
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const hasAnswered = Boolean(skipResult) || Boolean(answerResult?.answerRevealed);
  const isFreeTextMode = inputMode === QuizInputMode.FREE_TEXT;
  const transitionKey = loadingQuestion ? 'loading' : `${questionDirection}:${inputMode}:${question?.itemId ?? 'empty'}`;
  const resultState = answerResult?.correct === true
      ? 'correct'
    : skipResult || answerResult?.correct === false || wrongSelections.length > 0
      ? 'wrong'
      : null;

  const submitDisabled = loadingQuestion || submittingAnswer || usingHint || !question || !selectedOption || hasAnswered;
  const skipDisabled = loadingQuestion || submittingAnswer || usingHint || !question;
  const hintDisabled = loadingQuestion || submittingAnswer || usingHint || !question || hasAnswered || question.options.length <= 2;
  const nextDisabled = loadingQuestion || submittingAnswer || usingHint;
  const showOfflineFallback = !isOnline && !question && (loadingQuestion || Boolean(error));
  const questionActions = (
    <>
      <ModeTrigger
        disabled={loadingQuestion || submittingAnswer}
        onOpen={() => setModeModalOpen(true)}
        scopeLabel={t((topicConfig.scopes.find((s) => s.value === questionScope)?.labelKey ?? '') as TranslationKey)}
      />
      <HintTrigger disabled={hintDisabled} pending={usingHint} hasResult={Boolean(hintResult)} onOpen={() => setHintModalOpen(true)} />
    </>
  );

  return (
    <CardSection transitionKey={transitionKey} resultState={resultState}>
      <div className="grid gap-2 md:grid-cols-[minmax(0,3fr)_minmax(10rem,2fr)] md:items-start md:gap-3">
        <div className="min-w-0">
          <QuestionContentFrame>
            {loadingQuestion ? (
              <>
                <div className="mb-2 flex justify-end gap-2">{questionActions}</div>
                <LoadingState inputMode={inputMode} />
                {showOfflineFallback ? <OfflineStateHint className="mt-3" /> : null}
              </>
            ) : null}

            {!loadingQuestion && showOfflineFallback ? (
              <>
                <div className="mb-2 flex justify-end gap-2">{questionActions}</div>
                <LoadingState inputMode={inputMode} />
                <OfflineStateHint className="mt-3" />
              </>
            ) : null}

            {!loadingQuestion && question && !showOfflineFallback ? (
              <>
                <QuestionHeading question={question} actions={questionActions} />
                {isFreeTextMode ? (
                  <FreeTextAnswerInput
                    selectedOption={selectedOption}
                    hasAnswered={hasAnswered}
                    submittingAnswer={submittingAnswer}
                    questionDirection={question.questionDirection}
                    onSelectOption={onSelectOption}
                  />
                ) : (
                  <AnswerOptionsList
                    question={question}
                    selectedOption={selectedOption}
                    hasAnswered={hasAnswered}
                    submittingAnswer={submittingAnswer}
                    skipResult={skipResult}
                    answerResult={answerResult}
                    wrongSelections={wrongSelections}
                    onSelectOption={onSelectOption}
                  />
                )}
              </>
            ) : null}
          </QuestionContentFrame>

          <ResultNotice answerResult={answerResult} skipResult={skipResult} hasAnswered={hasAnswered} />
          {error && !showOfflineFallback ? <ErrorNotice error={error} /> : null}
        </div>
        <ActionRow
          hasAnswered={hasAnswered}
          submittingAnswer={submittingAnswer}
          submitDisabled={submitDisabled}
          skipDisabled={skipDisabled}
          nextDisabled={nextDisabled}
          onSubmitAnswer={onSubmitAnswer}
          onSkipQuestion={onSkipQuestion}
          onNextQuestion={onNextQuestion}
        />
      </div>
      <HintModal
        isOpen={hintModalOpen}
        onClose={() => setHintModalOpen(false)}
        difficulty={question?.difficulty ?? 1}
        currentProgress={currentProgress}
        loadingStats={loadingStats}
        hintDisabled={hintDisabled}
        usingHint={usingHint}
        hintResult={hintResult}
        onUseHint={onUseHint}
      />
      <ModeModal
        isOpen={modeModalOpen}
        onClose={() => setModeModalOpen(false)}
        inputMode={inputMode}
        questionDirection={questionDirection}
        questionScope={questionScope}
        loadingQuestion={loadingQuestion}
        submittingAnswer={submittingAnswer}
        allowReverseMode={allowReverseMode}
        onInputModeChange={onInputModeChange}
        onQuestionDirectionChange={onQuestionDirectionChange}
        onQuestionScopeChange={onQuestionScopeChange}
      />
      <AchievementUnlockedModal achievement={unlockedAchievements[0] ?? null} onClose={onDismissAchievement} />
    </CardSection>
  );
}