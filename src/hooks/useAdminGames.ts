"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "@/components/toast";
import { useI18n } from "@/components/I18nProvider";
import type { AdminGame, CreateGamePayload, UpdateGamePayload } from "@/lib/types";

function toErrorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

export function useAdminGames(token: string, enabled: boolean) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const gamesKey = ["admin-games", token];

  const gamesQuery = useQuery<{ games: AdminGame[] }>({
    queryKey: gamesKey,
    queryFn: () => apiClient.getAdminGames(token),
    enabled,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: gamesKey });

  const createMutation = useMutation({
    mutationFn: (payload: CreateGamePayload) => apiClient.createAdminGame(payload, token),
    onSuccess: async () => { await invalidate(); toast.success(t("admin_games_saved")); },
    onError: (cause) => toast.error(toErrorMessage(cause, t("common_unexpected_error"))),
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: UpdateGamePayload }) => apiClient.updateAdminGame(slug, payload, token),
    onSuccess: async () => { await invalidate(); toast.success(t("admin_games_saved")); },
    onError: (cause) => toast.error(toErrorMessage(cause, t("common_unexpected_error"))),
  });

  const removeMutation = useMutation({
    mutationFn: (slug: string) => apiClient.removeAdminGame(slug, token),
    onSuccess: async () => { await invalidate(); toast.success(t("admin_games_deleted")); },
    onError: (cause) => toast.error(toErrorMessage(cause, t("common_unexpected_error"))),
  });

  return {
    games: gamesQuery.data?.games ?? [],
    loadingGames: gamesQuery.isLoading || gamesQuery.isFetching,
    gamesError: gamesQuery.error ? toErrorMessage(gamesQuery.error, t("common_unexpected_error")) : null,
    savingGame: createMutation.isPending || updateMutation.isPending,
    deletingGame: removeMutation.isPending,
    createGame: (payload: CreateGamePayload) => createMutation.mutateAsync(payload),
    updateGame: (slug: string, payload: UpdateGamePayload) => updateMutation.mutateAsync({ slug, payload }),
    removeGame: (slug: string) => removeMutation.mutateAsync(slug),
  };
}