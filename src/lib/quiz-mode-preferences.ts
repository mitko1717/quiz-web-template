import { QuestionDirection, QuizContinentScope, QuizInputMode } from "@/lib/types";

const INPUT_MODE_KEY = "quiz.inputMode";
const QUESTION_DIRECTION_KEY = "quiz.questionDirection";
const QUESTION_SCOPE_KEY = "quiz.questionScope";

export function readStoredInputMode(): QuizInputMode {
  if (typeof window === "undefined") return QuizInputMode.MULTIPLE_CHOICE;
  const stored = window.localStorage.getItem(INPUT_MODE_KEY);
  return stored === QuizInputMode.FREE_TEXT ? QuizInputMode.FREE_TEXT : QuizInputMode.MULTIPLE_CHOICE;
}

export function writeStoredInputMode(mode: QuizInputMode): void {
  if (typeof window !== "undefined") window.localStorage.setItem(INPUT_MODE_KEY, mode);
}

export function readStoredQuestionDirection(): QuestionDirection {
  if (typeof window === "undefined") return QuestionDirection.FORWARD;
  const stored = window.localStorage.getItem(QUESTION_DIRECTION_KEY);
  return stored === QuestionDirection.REVERSE ? QuestionDirection.REVERSE : QuestionDirection.FORWARD;
}

export function writeStoredQuestionDirection(direction: QuestionDirection): void {
  if (typeof window !== "undefined") window.localStorage.setItem(QUESTION_DIRECTION_KEY, direction);
}

export function readStoredQuestionScope(): QuizContinentScope {
  if (typeof window === "undefined") return QuizContinentScope.WORLD;
  const stored = window.localStorage.getItem(QUESTION_SCOPE_KEY);
  switch (stored) {
    case QuizContinentScope.AFRICA:
    case QuizContinentScope.AMERICAS:
    case QuizContinentScope.ASIA:
    case QuizContinentScope.EUROPE:
    case QuizContinentScope.OCEANIA:
      return stored;
    default:
      return QuizContinentScope.WORLD;
  }
}

export function writeStoredQuestionScope(scope: QuizContinentScope): void {
  if (typeof window !== "undefined") window.localStorage.setItem(QUESTION_SCOPE_KEY, scope);
}