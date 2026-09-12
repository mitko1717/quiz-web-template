"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useI18n } from "@/components/I18nProvider";

export function useOtherGamesQuery(token?: string) {
  const { language } = useI18n();

  return useQuery({
    queryKey: ["platform-games", token ?? "anon", language],
    queryFn: () => apiClient.getOtherGames(token, language),
    staleTime: 5 * 60 * 1000,
  });
}