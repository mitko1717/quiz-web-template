"use client";

import { Button } from "@/components/button";
import { CheckIcon, XIcon } from "@/components/icons";

interface AnswerOptionProps {
  label: string;
  selected: boolean;
  locked: boolean;
  triedWrong: boolean;
  isCorrectAnswer: boolean;
  isWrongSelection: boolean;
  isNoneOfAbove: boolean;
  isFlagOption?: boolean;
  onSelect: () => void;
}

function OptionIndicator({ selected, isCorrectAnswer, isWrong }: { selected: boolean; isCorrectAnswer: boolean; isWrong: boolean }) {
  if (isCorrectAnswer) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-mint text-base-900">
        <CheckIcon className="h-3 w-3" />
      </span>
    );
  }

  if (isWrong) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pastel-coral text-base-900">
        <XIcon className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span
      className={[
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-accent-green" : "border-ink-500/60",
      ].join(" ")}
    >
      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-accent-green shadow-[0_0_6px_var(--color-accent-green)]" /> : null}
    </span>
  );
}

export function AnswerOption({ label, selected, locked, triedWrong, isCorrectAnswer, isWrongSelection, isNoneOfAbove, isFlagOption, onSelect }: AnswerOptionProps) {
  const variant = (() => {
    if (isCorrectAnswer) return "answerCorrect" as const;
    if (isWrongSelection) return "answerWrong" as const;
    if (triedWrong) return "answerTriedWrong" as const;
    if (selected) return "answerSelected" as const;
    if (locked) return "answerLocked" as const;
    return "answerIdle" as const;
  })();

  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      onClick={onSelect}
      disabled={locked}
      className={[
        "min-h-11 w-full px-3 py-2 text-left text-[0.95rem] leading-5 font-semibold transition-all duration-200 sm:min-h-12 sm:px-4 sm:text-[1.02rem]",
        isNoneOfAbove && !selected && !isCorrectAnswer && !isWrongSelection ? "border-dashed border-[1.5px]" : "",
        isCorrectAnswer ? "answer-correct-vivid" : "",
      ].join(" ")}
    >
      <span className="flex min-w-0 items-center gap-3">
        <OptionIndicator selected={selected} isCorrectAnswer={isCorrectAnswer} isWrong={isWrongSelection || triedWrong} />
        <span className={isFlagOption ? "block min-w-0 break-words text-4xl leading-none" : "block min-w-0 break-words"} aria-hidden={isFlagOption ? "true" : undefined}>
          {label}
        </span>
      </span>
    </Button>
  );
}
