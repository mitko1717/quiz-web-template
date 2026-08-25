"use client";

import { Button } from "@/components/button";

interface AnswerOptionProps {
  label: string;
  selected: boolean;
  locked: boolean;
  triedWrong: boolean;
  isCorrectAnswer: boolean;
  isWrongSelection: boolean;
  isNoneOfAbove: boolean;
  onSelect: () => void;
}

export function AnswerOption({ label, selected, locked, triedWrong, isCorrectAnswer, isWrongSelection, isNoneOfAbove, onSelect }: AnswerOptionProps) {
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
        "min-h-10 w-full px-2.5 py-1.5 text-left text-[0.95rem] leading-5 font-semibold transition-colors duration-200 sm:min-h-11 sm:px-3.5 sm:py-2 sm:text-[1.02rem]",
        isNoneOfAbove ? "border-dashed border-[1.5px] bg-base-700/85 text-ink-200" : "",
        isCorrectAnswer ? "answer-correct-vivid" : "",
      ].join(" ")}
    >
      <span className="block min-w-0 break-words">{label}</span>
    </Button>
  );
}
