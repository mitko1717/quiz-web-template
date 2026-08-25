"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "@/components/toast";
import type { AdminGameplayConfigSchemaResponse, AdminQuizConfigResponse, AdminUserStatsDetailsResponse, AdminUsersStatsResponse } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function toErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  return fallback;
}

export function useAdminPanel(token: string, enabled: boolean, pageSize = 5) {
  const { t } = useI18n();
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [saveConfigError, setSaveConfigError] = useState<string | null>(null);

  const usersQuery = useQuery<AdminUsersStatsResponse>({
    queryKey: queryKeys.adminUsers(token, pageSize, offset, search.trim()),
    queryFn: () => apiClient.getAdminUsersStats({ limit: pageSize, offset, search: search.trim() || undefined }, token),
    enabled,
  });

  const effectiveSelectedUserId =
    usersQuery.data && usersQuery.data.items.length > 0
      ? (selectedUserId && usersQuery.data.items.some(i => i.userId === selectedUserId)
          ? selectedUserId
          : usersQuery.data.items[0].userId)
      : null;

  const selectedUserQuery = useQuery<AdminUserStatsDetailsResponse>({
    queryKey: queryKeys.adminUserDetails(token, effectiveSelectedUserId ?? 'none'),
    queryFn: () => apiClient.getAdminUserStats(effectiveSelectedUserId ?? '', token),
    enabled: enabled && Boolean(effectiveSelectedUserId),
  });

  const gameplayConfigQuery = useQuery<AdminQuizConfigResponse>({
    queryKey: queryKeys.adminGameplayConfig(token),
    queryFn: () => apiClient.getAdminGameplayConfig(token),
    enabled,
  });

  const gameplayConfigSchemaQuery = useQuery<AdminGameplayConfigSchemaResponse>({
    queryKey: queryKeys.adminGameplayConfigSchema(token),
    queryFn: () => apiClient.getAdminGameplayConfigSchema(token),
    enabled,
  });

  const updateConfigMutation = useMutation({
    mutationFn: (patch: Partial<AdminQuizConfigResponse>) => apiClient.updateAdminGameplayConfig(patch, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminGameplayConfig(token) });
      toast.success(t('admin_config_saved'));
      setSaveConfigError(null);
    },
    onError: (cause) => {
      const msg = toErrorMessage(cause, t('common_unexpected_error'));
      setSaveConfigError(msg);
      toast.error(msg);
    },
  });

  const resetConfigMutation = useMutation({
    mutationFn: () => apiClient.resetAdminGameplayConfig(token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminGameplayConfig(token) });
      toast.success(t('admin_config_reset'));
      setSaveConfigError(null);
    },
    onError: (cause) => {
      const msg = toErrorMessage(cause, t('common_unexpected_error'));
      setSaveConfigError(msg);
      toast.error(msg);
    },
  });

  const usersOfflineFallback = !isOnline && !usersQuery.data && (usersQuery.isLoading || usersQuery.isFetching || Boolean(usersQuery.error));
  const selectedUserOfflineFallback =
    !isOnline &&
    Boolean(effectiveSelectedUserId) &&
    !selectedUserQuery.data &&
    (selectedUserQuery.isLoading || selectedUserQuery.isFetching || Boolean(selectedUserQuery.error));
  const gameplayConfigOfflineFallback =
    !isOnline &&
    !gameplayConfigQuery.data &&
    (gameplayConfigQuery.isLoading || gameplayConfigQuery.isFetching || Boolean(gameplayConfigQuery.error));

  const usersError = usersOfflineFallback ? null : (usersQuery.error ? toErrorMessage(usersQuery.error, t('common_unexpected_error')) : null);
  const selectedUserError = selectedUserOfflineFallback
    ? null
    : (selectedUserQuery.error ? toErrorMessage(selectedUserQuery.error, t('common_unexpected_error')) : null);
  const gameplayConfigError = gameplayConfigOfflineFallback
    ? null
    : (gameplayConfigQuery.error ? toErrorMessage(gameplayConfigQuery.error, t('common_unexpected_error')) : null);

  const reloadUsers = useCallback(() => {
    void usersQuery.refetch();
  }, [usersQuery]);

  const reloadGameplayConfig = useCallback(() => {
    void gameplayConfigQuery.refetch();
    void gameplayConfigSchemaQuery.refetch();
  }, [gameplayConfigQuery, gameplayConfigSchemaQuery]);

  const selectUser = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const updateGameplayConfig = useCallback(async (patch: Partial<AdminQuizConfigResponse>) => {
    await updateConfigMutation.mutateAsync(patch);
  }, [updateConfigMutation]);

  const resetGameplayConfig = useCallback(async () => {
    await resetConfigMutation.mutateAsync();
  }, [resetConfigMutation]);

  return {
    users: usersQuery.data ?? null,
    selectedUser: selectedUserQuery.data ?? null,
    gameplayConfig: gameplayConfigQuery.data ?? null,
    gameplayConfigSchema: gameplayConfigSchemaQuery.data ?? null,
    search,
    setSearch,
    offset,
    pageSize,
    goToPage: (page: number) => { setOffset(page * pageSize); },
    loadingUsers: usersQuery.isLoading || usersQuery.isFetching || usersOfflineFallback,
    loadingSelectedUser: selectedUserQuery.isLoading || selectedUserQuery.isFetching || selectedUserOfflineFallback,
    loadingGameplayConfig: gameplayConfigQuery.isLoading || gameplayConfigQuery.isFetching || gameplayConfigOfflineFallback,
    loadingGameplayConfigSchema: gameplayConfigSchemaQuery.isLoading || gameplayConfigSchemaQuery.isFetching,
    usersError,
    selectedUserError,
    gameplayConfigError,
    isOffline: !isOnline,
    savingConfig: updateConfigMutation.isPending || resetConfigMutation.isPending,
    saveConfigError,
    reloadUsers,
    reloadGameplayConfig,
    selectUser,
    updateGameplayConfig,
    resetGameplayConfig,
  };
}
