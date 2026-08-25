"use client";

import { Button } from "@/components/button";
import { ContinentPieceIcon } from "@/components/icons/ContinentPieceIcon";
import type { TranslationKey } from "@/lib/i18n";
import { QuestionDirection, QuizContinentScope, QuizInputMode } from "@/lib/types";
import { useI18n } from "@/providers/I18nProvider";

export function scopeLabelKey(scope: QuizContinentScope): TranslationKey {
  switch (scope) {
    case QuizContinentScope.AFRICA:
      return "question_scope_africa";
    case QuizContinentScope.AMERICAS:
      return "question_scope_americas";
    case QuizContinentScope.ASIA:
      return "question_scope_asia";
    case QuizContinentScope.EUROPE:
      return "question_scope_europe";
    case QuizContinentScope.OCEANIA:
      return "question_scope_oceania";
    default:
      return "question_scope_world";
  }
}

type QuizModeControlsProps = {
  inputMode: QuizInputMode;
  questionDirection: QuestionDirection;
  questionScope: QuizContinentScope;
  disabled?: boolean;
  onInputModeChange: (mode: QuizInputMode) => void;
  onQuestionDirectionChange: (direction: QuestionDirection) => void;
  onQuestionScopeChange: (scope: QuizContinentScope) => void;
};

export function QuizModeControls({
  inputMode,
  questionDirection,
  questionScope,
  disabled = false,
  onInputModeChange,
  onQuestionDirectionChange,
  onQuestionScopeChange
}: QuizModeControlsProps) {
  const { t } = useI18n();
  const scopes: QuizContinentScope[] = [
    QuizContinentScope.WORLD,
    QuizContinentScope.AFRICA,
    QuizContinentScope.AMERICAS,
    QuizContinentScope.ASIA,
    QuizContinentScope.EUROPE,
    QuizContinentScope.OCEANIA
  ];

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
            {t("question_direction_forward")}
          </Button>
          <Button
            type="button"
            variant={questionDirection === QuestionDirection.REVERSE ? "inputModeActive" : "inputModeIdle"}
            size="md"
            disabled={disabled}
            onClick={() => onQuestionDirectionChange(QuestionDirection.REVERSE)}
            className="min-h-11 rounded-lg px-2 py-2 text-xs leading-tight"
          >
            {t("question_direction_reverse")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-base-600 bg-base-700/30 p-1.5">
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-500">{t("question_scope_label")}</p>
        <p className="mb-1.5 px-2 text-[11px] text-ink-400">{t("question_scope_desc")}</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {scopes.map((scope) => (
            <Button
              key={scope}
              type="button"
              variant={questionScope === scope ? "inputModeActive" : "inputModeIdle"}
              size="md"
              disabled={disabled}
              onClick={() => onQuestionScopeChange(scope)}
              className="min-h-11 rounded-lg px-2 py-2 text-xs leading-tight"
            >
              <span className="inline-flex items-center gap-1.5">
                <ContinentPieceIcon scope={scope} />
                <span>{t(scopeLabelKey(scope))}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
