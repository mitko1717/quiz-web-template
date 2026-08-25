"use client";

import { Button } from "@/components/button";
import { topicConfig } from "@/lib/topic.config";
import { QuestionDirection, QuizScope, QuizInputMode } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";
import { TranslationKey } from "@/lib/i18n";

type QuizModeControlsProps = {
  inputMode: QuizInputMode;
  questionDirection: QuestionDirection;
  questionScope: QuizScope;
  disabled?: boolean;
  onInputModeChange: (mode: QuizInputMode) => void;
  onQuestionDirectionChange: (direction: QuestionDirection) => void;
  onQuestionScopeChange: (scope: QuizScope) => void;
};

export function QuizModeControls(props: QuizModeControlsProps) {
  const { t } = useI18n();
  const answerNoun = t(`${topicConfig.slug}_answer_noun` as TranslationKey);
  const promptNoun = t(`${topicConfig.slug}_prompt_noun` as TranslationKey);
  const { inputMode, questionDirection, questionScope, disabled, onInputModeChange, onQuestionDirectionChange, onQuestionScopeChange } = props;

  const scopes = topicConfig.scopes;
  const hasScopes = scopes.length > 0;

  return (
    <div className="space-y-3">
      <div className="mb-3 rounded-xl border border-base-600 bg-base-700/30 p-1.5">
        <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-500">{t("question_input_mode_label")}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant={inputMode === QuizInputMode.MULTIPLE_CHOICE ? "inputModeActive" : "inputModeIdle"}
            size="md"
            disabled={disabled}
            onClick={() => onInputModeChange(QuizInputMode.MULTIPLE_CHOICE)}
            className="min-h-11 rounded-lg px-2.5 py-2 text-sm"
          >
            {t("question_input_mode_multiple_choice")}
          </Button>
          <Button
            type="button"
            variant={inputMode === QuizInputMode.FREE_TEXT ? "inputModeActive" : "inputModeIdle"}
            size="md"
            disabled={disabled}
            onClick={() => onInputModeChange(QuizInputMode.FREE_TEXT)}
            className="min-h-11 rounded-lg px-2.5 py-2 text-sm"
          >
            {t("question_input_mode_free_text")}
          </Button>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-base-600 bg-base-700/30 p-1.5">
        <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-500">{t("question_direction_label")}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            type="button"
            variant={questionDirection === QuestionDirection.FORWARD ? "inputModeActive" : "inputModeIdle"}
            size="md"
            disabled={disabled}
            onClick={() => onQuestionDirectionChange(QuestionDirection.FORWARD)}
            className="min-h-11 rounded-lg px-2 py-2 text-xs leading-tight"
          >
            {t("question_direction_forward", { answerNoun, promptNoun })}
          </Button>
          <Button
            type="button"
            variant={questionDirection === QuestionDirection.REVERSE ? "inputModeActive" : "inputModeIdle"}
            size="md"
            disabled={disabled}
            onClick={() => onQuestionDirectionChange(QuestionDirection.REVERSE)}
            className="min-h-11 rounded-lg px-2 py-2 text-xs leading-tight"
          >
            {t("question_direction_reverse", { answerNoun, promptNoun })}
          </Button>
        </div>
      </div>

      {hasScopes ? (
        <div className="rounded-xl border border-base-600 bg-base-700/30 p-1.5">
          <p className="px-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-500">{t("question_scope_label")}</p>
          <p className="mb-1.5 px-2 text-[11px] text-ink-400">{t("question_scope_desc")}</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {scopes.map((scope) => (
              <Button
                key={scope.value}
                type="button"
                variant={questionScope === scope.value ? "inputModeActive" : "inputModeIdle"}
                size="md"
                disabled={disabled}
                onClick={() => onQuestionScopeChange(scope.value)}
                className="min-h-11 rounded-lg px-2 py-2 text-xs leading-tight"
              >
                {t(scope.labelKey as TranslationKey)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
