import { request } from "../http";
import type { DifficultyLevel, ProgressResponse, UserAnswerStatsResponse } from "../types";

export const progressApi = {
  getAllProgress(token: string) {
    return request<ProgressResponse[]>("/progress", { token });
  },

  getProgressForLevel(difficulty: DifficultyLevel, token: string) {
    return request<ProgressResponse>(`/progress/${difficulty}`, { token });
  },

  getAnswerStats(token: string) {
    return request<UserAnswerStatsResponse>("/progress/stats", { token });
  },
};
