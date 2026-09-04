"use client";
import { createContext, ChangeEvent, useContext, useState, useSyncExternalStore } from "react";
import { useEffect } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { BodyText, SectionLabel } from "@/components/common/SectionLabel";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { FooterNav } from "@/components/FooterNav";
import { useTelegram } from "@/providers/TelegramProvider";
import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import { getApiBaseUrlForDisplay } from "@/lib/http";
import type { Language } from "@/lib/i18n";
import type { AuthContextValue, AuthGateProps } from "./AuthGate.types";
import { useProfileQuery, useUpdateProfileLanguageMutation } from "@/hooks/useProfile";
import { topicConfig } from "@/lib/topic.config";
import { useI18n } from "@/components/I18nProvider";

const AuthContext = createContext<AuthContextValue | null>(null);

function readAllowedLocalAdminTelegramUserIds(): string[] {
  const raw = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN_USER_IDS ?? '';
  return raw.split(',').map((val) => val.trim()).filter((val) => val.length > 0);
}

const LOCAL_ADMIN_TELEGRAM_USER_IDS = readAllowedLocalAdminTelegramUserIds();

function getTgUserId(initData: string): string | null {
  const user = new URLSearchParams(initData).get('user');
  if (!user) return null;

  try {
    const parsed = JSON.parse(user) as { id?: unknown };
    return typeof parsed.id === 'number' ? String(parsed.id) : null;
  } catch {
    return null;
  }
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within <AuthGate />");

  return context;
}

export function AuthGate({ children, adminOnly = false }: AuthGateProps) {
  const { language, setLanguage, t } = useI18n();
  const { isTelegram } = useTelegram();
  const {
    token,
    authMode,
    username,
    loading,
    error,
    isGuestLoginPending,
    isLocalAdminLoginPending,
    isTelegramLoginPending,
    loginAsGuest,
    loginAsLocalAdmin,
    loginWithTelegram,
    linkWithGoogle,
    linkWithApple,
    logout,
  } = useAuth();
  const profileQuery = useProfileQuery(token ?? "");
  const updateLanguageMutation = useUpdateProfileLanguageMutation(token ?? "");
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [localUsername, setLocalUsername] = useState("admin");
  const [localPassword, setLocalPassword] = useState("admin");
  const [telegramLoginAttempted, setTelegramLoginAttempted] = useState(false);
  const [telegramLoginError, setTelegramLoginError] = useState<string | null>(null);
  const rawTelegramInitData = isTelegram ? retrieveRawInitData()?.trim() ?? '' : '';
  const tgUserId = getTgUserId(rawTelegramInitData);
  const canUseLocalAdminFallback = tgUserId !== null && LOCAL_ADMIN_TELEGRAM_USER_IDS.includes(tgUserId);

  const isSubmitting = loading;

  const handleLocalAdminSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loginAsLocalAdmin(localUsername, localPassword, rawTelegramInitData);
  };

  const localAdminForm = canUseLocalAdminFallback ? (
    <form className="mt-4 w-full max-w-md rounded-xl border border-base-600 bg-base-700/35 p-4 text-left sm:p-5" onSubmit={handleLocalAdminSubmit}>
      <h2 className="text-lg font-semibold text-ink-100">{t('auth_admin_title')}</h2>
      <BodyText>{t('auth_admin_desc')}</BodyText>
      <div className="mt-4 grid gap-3">
        <Input label={t('auth_username')} id="la-username" value={localUsername} onChange={e => setLocalUsername(e.target.value)} />
        <Input label={t('auth_password')} id="la-password" type="password" value={localPassword} onChange={e => setLocalPassword(e.target.value)} />
      </div>
      <Button type="submit" variant="secondary" className="mt-4 w-full sm:w-auto" disabled={isSubmitting}>
        {isLocalAdminLoginPending ? <LoadingSpinner size="sm" /> : t('auth_admin_sign_in')}
      </Button>
    </form>
  ) : null;

  useEffect(() => {
    if (!profileQuery.data?.preferredLanguage) return;
    setLanguage(profileQuery.data.preferredLanguage);
  }, [profileQuery.data?.preferredLanguage, setLanguage]);

  useEffect(() => {
    if (!hydrated || !isTelegram || telegramLoginAttempted) return;
    if (authMode === 'telegram' || authMode === 'localAdmin') return;
    if (loading) return;

    const attemptTelegramLogin = async () => {
      try {
        const rawInitData = retrieveRawInitData()?.trim() ?? '';
        if (!rawInitData) throw new Error(t('auth_telegram_init_data_missing'));
        await loginWithTelegram(rawInitData);
        setTelegramLoginError(null);
      } catch (cause) {
        setTelegramLoginError(cause instanceof Error ? cause.message : t('auth_telegram_login_failed'));
      } finally {
        setTelegramLoginAttempted(true);
      }
    };

    void attemptTelegramLogin();
  }, [authMode, hydrated, isTelegram, loading, loginWithTelegram, t, telegramLoginAttempted]);

  const setPreferredLanguage = async (nextLanguage: Language) => {
    if (!token) return;
    const previousLanguage = language;
    setLanguage(nextLanguage);
    try {
      await updateLanguageMutation.mutateAsync(nextLanguage);
    } catch {
      setLanguage(previousLanguage);
      throw new Error(t('common_unexpected_error'));
    }
  };

  if (!hydrated || loading || (isTelegram && !token && (isTelegramLoginPending || !telegramLoginAttempted))) {
    return (
      <div className="auth-page flex items-center justify-center bg-base-900 px-4 sm:px-6" aria-busy="true">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || telegramLoginError || !token) {
    const baseUrl = getApiBaseUrlForDisplay() || t('auth_backend_not_set');
    const authError = telegramLoginError ?? error;

    const handleGuestLogin = async () => {
      await loginAsGuest();
    };

    if (isTelegram) {
      return (
        <div className="auth-page flex items-start justify-center overflow-y-auto bg-base-900 px-4 sm:px-6">
          <div className="w-full max-w-2xl rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-6">
            <div className="rounded-2xl border border-pastel-coral/40 bg-pastel-coral/10 p-5 sm:p-6">
              <SectionLabel>{t('auth_signin_section_label')}</SectionLabel>
              <h1 className="mt-2 text-2xl font-semibold text-ink-100 sm:text-3xl">{t('auth_telegram_failed_title')}</h1>
              <p className="mt-3 text-sm text-ink-300">{t('auth_telegram_failed_desc')}</p>
              <div className="mt-4 rounded-xl border border-base-600 bg-base-900/30 p-3 text-sm text-ink-300">
                {t('auth_backend_url')} <span className="font-mono text-ink-100">{baseUrl}</span>
              </div>
              {authError ? (
                <pre className="edge-safe-scroll mt-4 overflow-x-auto rounded-lg border border-pastel-coral/40 bg-pastel-coral/10 p-3 text-xs text-pastel-coral">
                  {authError}
                </pre>
              ) : null}
            </div>

            {canUseLocalAdminFallback ? (
              <details className="mt-4 rounded-xl border border-base-600 bg-base-700/30 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink-200">{t('auth_local_admin_fallback_title')}</summary>
                <p className="mt-2 text-xs text-ink-400">{t('auth_local_admin_fallback_desc')}</p>
                {localAdminForm}
              </details>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <div className="auth-page flex items-start justify-center overflow-y-auto bg-base-900 px-4 sm:px-6">
        <div className="w-full max-w-4xl rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-accent-greenDim/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent-green)_16%,transparent),color-mix(in_srgb,var(--color-base-900)_25%,transparent))] p-5 sm:p-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <SectionLabel>{t('auth_tool_label', { appName: topicConfig.appName })}</SectionLabel>
                <LanguageSwitcher compact />
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-ink-100 sm:text-3xl">{t('auth_choose_mode_title')}</h1>
              <p className="mt-3 text-sm text-ink-300">
                {t('auth_choose_mode_desc')}
              </p>
              <div className="mt-5 rounded-xl border border-base-600 bg-base-900/30 p-4 text-sm text-ink-300">
                {t('auth_backend_url')} <span className="font-mono text-ink-100">{baseUrl}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-base-600 bg-base-700/35 p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-ink-100">{t('auth_guest_title')}</h2>
                <BodyText>{t('auth_guest_desc')}</BodyText>
                <Button
                  type="button"
                  variant="primary"
                  className="mt-4 w-full sm:w-auto"
                  onClick={() => void handleGuestLogin()}
                  disabled={isSubmitting}
                >
                  {isGuestLoginPending ? <LoadingSpinner size="sm" /> : t('auth_guest_continue')}
                </Button>
              </div>

              {authError ? (
                <pre className="edge-safe-scroll overflow-x-auto rounded-lg border border-pastel-coral/40 bg-pastel-coral/10 p-3 text-xs text-pastel-coral">
                  {authError}
                </pre>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = authMode === "localAdmin" || profileQuery.data?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ token, authMode: authMode ?? "guest", username, setPreferredLanguage, linkWithGoogle, linkWithApple, logout, isAdmin }}
    >
      {adminOnly && authMode !== "localAdmin" ? (
        <div className="auth-page flex flex-col items-center justify-center bg-base-900 px-4 text-center text-ink-300 sm:px-6">
          <p>{t('auth_admin_access_required')}</p>
          {localAdminForm}
        </div>
      ) : (
        <>
          <div>{children}</div>
          <FooterNav authMode={authMode ?? "guest"} />
        </>
      )}
    </AuthContext.Provider>
  );
}

