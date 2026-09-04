import { request } from "../http";
import { topicConfig } from "../topic.config";
import { QuestionDirection, QuizScope, QuizInputMode, type AnswerResponse, type DifficultyLevel, type HintResponse, type QuestionResponse, type SkipResponse } from "../types";

export const quizApi = {
  getQuestion(difficulty: DifficultyLevel, inputMode: QuizInputMode, questionDirection: QuestionDirection, scope: QuizScope, token: string) {
    const params = new URLSearchParams({ difficulty: String(difficulty), inputMode, questionDirection });
    if (scope !== topicConfig.scopeValue) params.set(topicConfig.scopeParam, scope);

    return request<QuestionResponse>(`/quiz/question?${params.toString()}`, { token });
  },

  submitAnswer(payload: { questionId: string; selectedOption: string }, token: string) {
    return request<AnswerResponse>("/quiz/answer", { method: "POST", body: payload, token });
  },

  skipQuestion(payload: { questionId: string }, token: string) {
    return request<SkipResponse>("/quiz/skip", { method: "POST", body: payload, token });
  },

  useHint(payload: { questionId: string }, token: string) {
    return request<HintResponse>("/quiz/hint", { method: "POST", body: payload, token });
  },
};
