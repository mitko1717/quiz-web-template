import { request } from "../http";
import type { AchievementProgressResponse } from "../types";

export const achievementsApi = {
  getMine(token: string) {
    return request<AchievementProgressResponse[]>("/achievements", { token });
  }
};