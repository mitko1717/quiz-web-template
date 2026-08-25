import { request } from "../http";
import type { AdminGameplayConfigSchemaResponse, AdminQuizConfigResponse, AdminUserStatsDetailsResponse, AdminUsersStatsResponse } from "../types";

export const adminApi = {
  getUsersStats(query: { limit?: number; offset?: number; search?: string }, token: string) {
    const params = new URLSearchParams();
    if (typeof query.limit === "number") params.set("limit", String(query.limit));
    if (typeof query.offset === "number") params.set("offset", String(query.offset));
    if (query.search) params.set("search", query.search);
    return request<AdminUsersStatsResponse>(`/admin/users/stats${params.toString() ? `?${params}` : ""}`, { token });
  },

  getUserStats(userId: string, token: string) {
    return request<AdminUserStatsDetailsResponse>(`/admin/users/${userId}/stats`, { token });
  },

  getGameplayConfig(token: string) {
    return request<AdminQuizConfigResponse>("/admin/gameplay/config", { token });
  },

  getGameplayConfigSchema(token: string) {
    return request<AdminGameplayConfigSchemaResponse>("/admin/gameplay/config/schema", { token });
  },

  updateGameplayConfig(body: Partial<AdminQuizConfigResponse>, token: string) {
    return request<AdminQuizConfigResponse>("/admin/gameplay/config", { method: "PATCH", body, token });
  },

  resetGameplayConfig(token: string) {
    return request<AdminQuizConfigResponse>("/admin/gameplay/config/reset", { method: "POST", token });
  },
};
