"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useOtherGamesQuery(token?: string) {
  return useQuery({
    queryKey: ["platform-games", token ?? "anon"],
    queryFn: () => apiClient.getOtherGames(token),
    staleTime: 5 * 60 * 1000,
  });
}