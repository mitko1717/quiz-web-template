import { request } from "../http";
import { QuestionDirection, QuizContinentScope, QuizInputMode, type AnswerResponse, type DifficultyLevel, type HintResponse, type QuestionResponse, type SkipResponse } from "../types";

export const quizApi = {
  getQuestion(difficulty: DifficultyLevel, inputMode: QuizInputMode, questionDirection: QuestionDirection, scope: QuizContinentScope, token: string) {
    const params = new URLSearchParams({
      difficulty: String(difficulty),
      inputMode,
      questionDirection
    });
    if (scope !== QuizContinentScope.WORLD) params.set('continent', scope);

    return request<QuestionResponse>(`/quiz/question?${params.toString()}`, { token });
  },

  submitAnswer(
    payload: { countryId: string; difficulty: DifficultyLevel; selectedOption: string },
    token: string,
  ) {
    return request<AnswerResponse>("/quiz/answer", { method: "POST", body: payload, token });
  },

  skipQuestion(payload: { countryId: string; difficulty: DifficultyLevel }, token: string) {
    return request<SkipResponse>("/quiz/skip", { method: "POST", body: payload, token });
  },

  useHint(payload: { countryId: string; difficulty: DifficultyLevel }, token: string) {
    return request<HintResponse>("/quiz/hint", { method: "POST", body: payload, token });
  },
};
