import type { ReactNode } from 'react';
import { type AnswerResponse, type HintResponse, type ProgressResponse, type QuestionDirection, type QuestionResponse, type QuizScope, type QuizInputMode, type SkipResponse, UnlockedAchievement } from '@/lib/types';

export interface QuestionCardProps {
  question: QuestionResponse | null;
  loadingQuestion: boolean;
  submittingAnswer: boolean;
  selectedOption: string | null;
  answerResult: AnswerResponse | null;
  skipResult: SkipResponse | null;
  hintResult: HintResponse | null;
  currentProgress: ProgressResponse | null;
  wrongSelections: string[];
  loadingStats: boolean;
  usingHint: boolean;
  error: string | null;
  allowReverseMode: boolean;
  onSelectOption: (option: string) => void;
  onSubmitAnswer: () => Promise<void>;
  onSkipQuestion: () => Promise<void>;
  onUseHint: () => Promise<void>;
  onNextQuestion: () => Promise<void>;
  inputMode: QuizInputMode;
  onInputModeChange: (mode: QuizInputMode) => void;
  questionDirection: QuestionDirection;
  onQuestionDirectionChange: (direction: QuestionDirection) => void;
  questionScope: QuizScope;
  onQuestionScopeChange: (scope: QuizScope) => void;
  unlockedAchievements: UnlockedAchievement[];
  onDismissAchievement: () => void;
}

export type InputModeToggleProps = {
  inputMode: QuizInputMode;
  loadingQuestion: boolean;
  submittingAnswer: boolean;
  onInputModeChange: (mode: QuizInputMode) => void;
};

export type QuestionDirectionToggleProps = {
  questionDirection: QuestionDirection;
  loadingQuestion: boolean;
  submittingAnswer: boolean;
  onQuestionDirectionChange: (direction: QuestionDirection) => void;
};

export type QuestionScopeToggleProps = {
  questionScope: QuizScope;
  loadingQuestion: boolean;
  submittingAnswer: boolean;
  onQuestionScopeChange: (scope: QuizScope) => void;
};

export type FreeTextAnswerInputProps = {
  selectedOption: string | null;
  hasAnswered: boolean;
  submittingAnswer: boolean;
  questionDirection: QuestionDirection;
  onSelectOption: (option: string) => void;
};

export type QuestionHeadingProps = {
  question: QuestionResponse;
  actions?: ReactNode;
};

export type AnswerOptionsListProps = {
  question: QuestionResponse;
  selectedOption: string | null;
  hasAnswered: boolean;
  submittingAnswer: boolean;
  skipResult: SkipResponse | null;
  answerResult: AnswerResponse | null;
  wrongSelections: string[];
  onSelectOption: (option: string) => void;
};

export type RetryNoticeProps = {
  answerResult: AnswerResponse;
};

export type ResultNoticeProps = {
  answerResult: AnswerResponse | null;
  skipResult: SkipResponse | null;
  hasAnswered: boolean;
};

export type HintNoticeProps = {
  hintResult: HintResponse | null;
};

export interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: QuestionResponse['difficulty'];
  currentProgress: QuestionCardProps['currentProgress'];
  loadingStats: boolean;
  hintDisabled: boolean;
  usingHint: boolean;
  hintResult: HintNoticeProps['hintResult'];
  onUseHint: () => Promise<void>;
}

export type HintTriggerProps = {
  disabled: boolean;
  pending: boolean;
  hasResult: boolean;
  onOpen: () => void;
};

export type ModeTriggerProps = {
  disabled: boolean;
  onOpen: () => void;
  scopeLabel: string;
};

export interface ModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputMode: QuizInputMode;
  questionDirection: QuestionDirection;
  questionScope: QuizScope;
  loadingQuestion: boolean;
  submittingAnswer: boolean;
  allowReverseMode: boolean;
  onInputModeChange: (mode: QuizInputMode) => void;
  onQuestionDirectionChange: (direction: QuestionDirection) => void;
  onQuestionScopeChange: (scope: QuizScope) => void;
}

export type ErrorNoticeProps = {
  error: string;
};

export type ActionRowProps = {
  hasAnswered: boolean;
  submittingAnswer: boolean;
  submitDisabled: boolean;
  skipDisabled: boolean;
  nextDisabled: boolean;
  onSubmitAnswer: () => Promise<void>;
  onSkipQuestion: () => Promise<void>;
  onNextQuestion: () => Promise<void>;
};
