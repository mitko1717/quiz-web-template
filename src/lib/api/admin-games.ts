import { request } from "../http";
import type { AdminGame, CreateGamePayload, UpdateGamePayload } from "../types";

export const adminGamesApi = {
  list(token: string) {
    return request<{ games: AdminGame[] }>("/admin/games", { token });
  },

  create(body: CreateGamePayload, token: string) {
    return request<AdminGame>("/admin/games", { method: "POST", body, token });
  },

  update(slug: string, body: UpdateGamePayload, token: string) {
    return request<AdminGame>(`/admin/games/${encodeURIComponent(slug)}`, { method: "PATCH", body, token });
  },

  remove(slug: string, token: string) {
    return request<void>(`/admin/games/${encodeURIComponent(slug)}`, { method: "DELETE", token });
  },
};