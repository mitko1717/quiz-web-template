import { QuestionDirection, QuizScope, QuizInputMode } from "@/lib/types";
import { topicConfig } from "@/lib/topic.config";

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

export function readStoredQuestionScope(): QuizScope {
  if (typeof window === "undefined") return topicConfig.scopeValue;
  const stored = window.localStorage.getItem(QUESTION_SCOPE_KEY);
  const isValid = stored != null && topicConfig.scopes.some((s) => s.value === stored);
  return isValid ? (stored as QuizScope) : topicConfig.scopeValue;
}

export function writeStoredQuestionScope(scope: QuizScope): void {
  if (typeof window !== "undefined") window.localStorage.setItem(QUESTION_SCOPE_KEY, scope);
}