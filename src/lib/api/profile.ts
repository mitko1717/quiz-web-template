import { request } from "../http";
import type {
  GlobalStatsResponse,
  ProfileDifficultyRequest,
  ProfileDifficultyResponse,
  ProfileLanguageRequest,
  ProfileLanguageResponse,
  ProfileResetRequest,
  ProfileResetResponse,
  ProfileResponse
} from "../types";

export const profileApi = {
  getProfile(token: string) {
    return request<ProfileResponse>("/profile", { token });
  },

  getGlobalStats(token: string) {
    return request<GlobalStatsResponse>("/profile/global-stats", { token });
  },

  updateLanguage(body: ProfileLanguageRequest, token: string) {
    return request<ProfileLanguageResponse>("/profile/language", { method: "PATCH", body, token });
  },

  updateDifficulty(body: ProfileDifficultyRequest, token: string) {
    return request<ProfileDifficultyResponse>("/profile/difficulty", { method: "PATCH", body, token });
  },

  resetProfile(body: ProfileResetRequest, token: string) {
    return request<ProfileResetResponse>("/profile/reset", { method: "POST", body, token });
  }
};