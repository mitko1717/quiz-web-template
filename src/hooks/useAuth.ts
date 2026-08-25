"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { AuthMode } from "@/lib/types";
import { resolveReferralContext } from "@/lib/auth-referral";
import { topicConfig } from "@/lib/topic.config";
import { useI18n } from "@/components/I18nProvider";

const DEVICE_ID_KEY = `${topicConfig.slug}-device-id`;
const AUTH_SESSION_KEY = `${topicConfig.slug}-auth-session`;

interface StoredAuthSession {
  token: string;
  refreshToken: string;
  mode: AuthMode;
  username?: string;
}

function isAuthMode(value: unknown): value is AuthMode {
  return value === "guest" || value === "localAdmin" || value === "google" || value === "apple" || value === "telegram";
}

function readStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as StoredAuthSession;
    if (
      typeof session.token === "string" &&
      typeof session.refreshToken === "string" &&
      isAuthMode(session.mode)
    ) {
      return session;
    }

    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

function getOrCreateDeviceId(): string {
  const existingId = localStorage.getItem(DEVICE_ID_KEY);
  if (existingId) return existingId;

  const newId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

function getStoredDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  const existingId = localStorage.getItem(DEVICE_ID_KEY);
  return existingId?.trim() ? existingId : null;
}

function toErrorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  return fallback;
}

function readReferralContext(activeToken?: string | null): { invitedBy: string | null; refCode?: string } {
  if (typeof window === "undefined") return { invitedBy: null };
  return resolveReferralContext({
    search: window.location.search,
    hasActiveToken: Boolean(activeToken),
    hasStoredSession: Boolean(readStoredSession()),
  });
}

function getAccessTokenExpiryMs(token: string): number | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(paddedPayload)) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

type PersistSession = (session: StoredAuthSession) => void;

type InvalidateProfile = (token: string) => Promise<void>;

export function useGuestLoginMutation(persistSession: PersistSession, invalidateProfile: InvalidateProfile) {
  return useMutation({
    mutationFn: (deviceId: string) => {
      const referralContext = readReferralContext();
      return apiClient.guestLogin(deviceId, referralContext.invitedBy, referralContext.refCode);
    },
    onSuccess: async (res) => {
      persistSession({ token: res.accessToken, refreshToken: res.refreshToken, mode: "guest" });
      await invalidateProfile(res.accessToken);
    },
  });
}

export function useLocalAdminLoginMutation(persistSession: PersistSession, invalidateProfile: InvalidateProfile) {
  return useMutation({
    mutationFn: ({ nextUsername, password, initData }: { nextUsername: string; password: string; initData?: string }) =>
      apiClient.localLogin(nextUsername, password, initData),
    onSuccess: async (res, vars) => {
      persistSession({ token: res.accessToken, refreshToken: res.refreshToken, mode: "localAdmin", username: vars.nextUsername.trim() });
      await invalidateProfile(res.accessToken);
    },
  });
}

export function useGoogleLinkMutation(persistSession: PersistSession, invalidateProfile: InvalidateProfile, token: string | null) {
  return useMutation({
    mutationFn: (idToken: string) => {
      const referralContext = readReferralContext(token);
      return apiClient.googleLogin(idToken, getOrCreateDeviceId(), referralContext.invitedBy, referralContext.refCode);
    },
    onSuccess: async (res) => {
      persistSession({ token: res.accessToken, refreshToken: res.refreshToken, mode: "google" });
      await invalidateProfile(res.accessToken);
    },
  });
}

export function useAppleLinkMutation(persistSession: PersistSession, invalidateProfile: InvalidateProfile, token: string | null) {
  return useMutation({
    mutationFn: (identityToken: string) => {
      const referralContext = readReferralContext(token);
      return apiClient.appleLogin(identityToken, getOrCreateDeviceId(), referralContext.invitedBy, referralContext.refCode);
    },
    onSuccess: async (res) => {
      persistSession({ token: res.accessToken, refreshToken: res.refreshToken, mode: "apple" });
      await invalidateProfile(res.accessToken);
    },
  });
}

export function useTgLoginMutation(persistSession: PersistSession, invalidateProfile: InvalidateProfile, token: string | null) {
  return useMutation({
    mutationFn: (initData: string) => {
      const referralContext = readReferralContext(token);
      return apiClient.telegramLogin(initData, referralContext.invitedBy, referralContext.refCode, getStoredDeviceId() ?? undefined);
    },
    onSuccess: async (res) => {
      persistSession({ token: res.accessToken, refreshToken: res.refreshToken, mode: "telegram" });
      await invalidateProfile(res.accessToken);
    },
  });
}

export function useAuth() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [initialSession] = useState<StoredAuthSession | null>(() => readStoredSession());
  const [token, setToken] = useState<string | null>(initialSession?.token ?? null);
  const [refreshToken, setRefreshToken] = useState<string | null>(initialSession?.refreshToken ?? null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(initialSession?.mode ?? null);
  const [username, setUsername] = useState<string | null>(initialSession?.username ?? null);
  const [isRestoringSession, setIsRestoringSession] = useState(Boolean(initialSession));
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const persistSession = useCallback((session: StoredAuthSession) => {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setToken(session.token);
    setRefreshToken(session.refreshToken);
    setAuthMode(session.mode);
    setUsername(session.username ?? null);
  }, []);

  const invalidateProfile = async (sessionToken: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile(sessionToken) });
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setToken(null);
    setRefreshToken(null);
    setAuthMode(null);
    setUsername(null);
  }, []);

  const refreshCurrentSession = useCallback(async () => {
    if (!refreshToken || !authMode) return;
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const refreshPromise = (async () => {
      try {
        const refreshed = await apiClient.refresh(refreshToken);
        const session = {
          token: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          mode: authMode,
          username: username ?? undefined,
        };

        persistSession(session);
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile(session.token) });
      } catch {
        clearSession();
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, [authMode, clearSession, persistSession, queryClient, refreshToken, username]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!initialSession) {
        setIsRestoringSession(false);
        return;
      }

      const expiryMs = getAccessTokenExpiryMs(initialSession.token);
      const hasValidAccessToken = typeof expiryMs === "number" && expiryMs - Date.now() > 5_000;
      if (hasValidAccessToken) {
        setIsRestoringSession(false);
        return;
      }

      try {
        const refreshed = await apiClient.refresh(initialSession.refreshToken);
        if (cancelled) return;

        const session = {
          token: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          mode: initialSession.mode,
          username: initialSession.username,
        };

        persistSession(session);
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile(session.token) });
      } catch {
        if (cancelled) return;

        clearSession();
      } finally {
        if (!cancelled) setIsRestoringSession(false);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession, initialSession, persistSession, queryClient]);

  useEffect(() => {
    if (!token || !refreshToken || isRestoringSession) return;

    const expiryMs = getAccessTokenExpiryMs(token);
    if (!expiryMs) return;

    const refreshEarlyMs = 5_000;
    const delayMs = Math.max(0, expiryMs - Date.now() - refreshEarlyMs);
    const timeoutId = window.setTimeout(() => {
      void refreshCurrentSession();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [isRestoringSession, refreshCurrentSession, refreshToken, token]);

  useEffect(() => {
    if (!token || !refreshToken || isRestoringSession) return;

    const refreshIfExpiredOrNearExpiry = () => {
      const expiryMs = getAccessTokenExpiryMs(token);
      if (!expiryMs || expiryMs - Date.now() > 5_000) return;
      void refreshCurrentSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshIfExpiredOrNearExpiry();
    };

    window.addEventListener("focus", refreshIfExpiredOrNearExpiry);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshIfExpiredOrNearExpiry);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isRestoringSession, refreshCurrentSession, refreshToken, token]);

  const guestLoginMutation = useGuestLoginMutation(persistSession, invalidateProfile);
  const localLoginMutation = useLocalAdminLoginMutation(persistSession, invalidateProfile);
  const googleLinkMutation = useGoogleLinkMutation(persistSession, invalidateProfile, token);
  const appleLinkMutation = useAppleLinkMutation(persistSession, invalidateProfile, token);
  const tgLoginMutation = useTgLoginMutation(persistSession, invalidateProfile, token);

  const loginAsGuest = async () => {
    try {
      await guestLoginMutation.mutateAsync(getOrCreateDeviceId());
    } catch (cause) {
      const message = toErrorMessage(cause, t('auth_guest_login_failed'));
      throw new Error(message);
    }
  };

  const loginAsLocalAdmin = async (nextUsername: string, password: string, initData?: string) => {
    try {
      await localLoginMutation.mutateAsync({ nextUsername, password, initData });
    } catch (cause) {
      const message = toErrorMessage(cause, t('auth_local_login_failed'));
      throw new Error(message);
    }
  };

  const linkWithGoogle = async (idToken: string) => {
    try {
      await googleLinkMutation.mutateAsync(idToken);
    } catch (cause) {
      const message = toErrorMessage(cause, t("auth_google_login_failed"));
      throw new Error(message);
    }
  };

  const linkWithApple = async (identityToken: string) => {
    try {
      await appleLinkMutation.mutateAsync(identityToken);
    } catch (cause) {
      const message = toErrorMessage(cause, t("auth_apple_login_failed"));
      throw new Error(message);
    }
  };

  const loginWithTelegram = async (initData: string) => {
    try {
      await tgLoginMutation.mutateAsync(initData);
    } catch (cause) {
      const message = toErrorMessage(cause, t("auth_telegram_login_failed"));
      throw new Error(message);
    }
  };

  const logout = () => {
    clearSession();
    queryClient.clear();
    guestLoginMutation.reset();
    localLoginMutation.reset();
    googleLinkMutation.reset();
    appleLinkMutation.reset();
    tgLoginMutation.reset();
  };

  const loading = isRestoringSession || guestLoginMutation.isPending || localLoginMutation.isPending || googleLinkMutation.isPending || appleLinkMutation.isPending || tgLoginMutation.isPending;
  const firstError = guestLoginMutation.error ?? localLoginMutation.error ?? googleLinkMutation.error ?? appleLinkMutation.error ?? tgLoginMutation.error;

  const error = firstError ? toErrorMessage(firstError, t('common_unexpected_error')) : null;

  return {
    token,
    authMode,
    username,
    loading,
    error,
    isGuestLoginPending: guestLoginMutation.isPending,
    isLocalAdminLoginPending: localLoginMutation.isPending,
    isGoogleLinkPending: googleLinkMutation.isPending,
    isAppleLinkPending: appleLinkMutation.isPending,
    isTelegramLoginPending: tgLoginMutation.isPending,
    loginAsGuest,
    loginAsLocalAdmin,
    loginWithTelegram,
    linkWithGoogle,
    linkWithApple,
    logout,
  };
}

