import { request } from "../http";
import type { DailyChallengeAnswerResponse, DailyChallengeStateResponse } from "../types";

export const dailyChallengeApi = {
  getToday(token: string) {
    return request<DailyChallengeStateResponse>("/daily-challenge", { token });
  },

  submitAnswer(payload: { itemId: string; selectedOption: string }, token: string) {
    return request<DailyChallengeAnswerResponse>("/daily-challenge/answer", { method: "POST", body: payload, token });
  },
};
