import { request } from "../http";
import type { DailyChallengeAnswerResponse, DailyChallengeStateResponse } from "../types";

export const dailyChallengeApi = {
  getToday(token: string, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const query = params.toString();
    return request<DailyChallengeStateResponse>(`/daily-challenge${query ? `?${query}` : ''}`, { token });
  },

  submitAnswer(payload: { itemId: string; selectedOption: string }, token: string, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const query = params.toString();
    return request<DailyChallengeAnswerResponse>(`/daily-challenge/answer${query ? `?${query}` : ''}`, { method: "POST", body: payload, token });
  },
};