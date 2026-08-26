import { request } from "../http";
import { topicConfig } from "../topic.config";
import type { PublicGame } from "../types";

export const gamesApi = {
  listOthers(token?: string) {
    const params = new URLSearchParams({ exclude: topicConfig.slug });
    return request<{ games: PublicGame[] }>(`/platform/games?${params.toString()}`, token ? { token } : {});
  },
};