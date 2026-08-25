"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/AuthGate";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";
import { AdminPanel } from "@/components/AdminPanel";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "@/components/Skeleton";
import { LANGUAGE_FLAGS } from "@/lib/constants/language-flags";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/button";
import { BodyText, SectionLabel } from "@/components/SectionLabel";
import { SignInPanel } from "@/components/SignInPanel";
import { QuizModeControls } from "@/components/QuizModeControls";
import { readStoredInputMode, readStoredQuestionDirection, readStoredQuestionScope, writeStoredInputMode, writeStoredQuestionDirection, writeStoredQuestionScope } from "@/lib/quiz-mode-preferences";
import { QuestionDirection, QuizScope, QuizInputMode, Language } from "@/lib/types";
import { useProfileQuery, useResetProfileMutation } from "@/hooks/useProfile";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useTelegram } from "@/providers/TelegramProvider";
import { toast } from "@/components/toast";
import { topicConfig } from "@/lib/topic.config";

export function SettingsPageContent() {
  const { token, authMode, logout, setPreferredLanguage } = useAuthContext();
  const { t, language } = useI18n();
  const { isOnline } = useNetworkStatus();
  const { isTelegram } = useTelegram();
  const profileQuery = useProfileQuery(token);
  const resetProfileMutation = useResetProfileMutation(token);
  const [preferredInputMode, setPreferredInputMode] = useState<QuizInputMode>(() => readStoredInputMode());
  const [preferredQuestionDirection, setPreferredQuestionDirection] = useState<QuestionDirection>(() => readStoredQuestionDirection());
  const [preferredQuestionScope, setPreferredQuestionScope] = useState<QuizScope>(() => readStoredQuestionScope());
  const [resetProgress, setResetProgress] = useState(true);
  const [resetAttempts, setResetAttempts] = useState(true);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAdminSettingsModalOpen, setIsAdminSettingsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isAdmin = authMode === "localAdmin" || profileQuery.data?.role === "admin";

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const referralLink = useMemo(() => {
    if (profileQuery.data?.referralLink) return profileQuery.data.referralLink;
    if (!profileQuery.data?.refCode) return null;
    if (typeof window === "undefined") return null;
    return `${window.location.origin}/?ref=${encodeURIComponent(profileQuery.data.refCode)}`;
  }, [profileQuery.data?.refCode, profileQuery.data?.referralLink]);

  const runReset = async () => {
    setError(null);
    setMessage(null);

    try {
      const result = await resetProfileMutation.mutateAsync({ resetProgress, resetAttempts, deleteAccount });
      if (result.accountDeleted) {
        logout();
        return;
      }

      setMessage(t("profile_reset_complete", { attempts: result.attemptsDeleted, progress: result.progressRowsDeleted }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("profile_reset_failed"));
    }
  };

  const handleSubmit = () => {
    setIsConfirmModalOpen(true);
  };

  const handleCancelConfirm = () => {
    const submitting = resetProfileMutation.isPending;
    if (submitting) return;
    setIsConfirmModalOpen(false);
  };

  const handleConfirm = () => {
    const submitting = resetProfileMutation.isPending;
    if (submitting) return;
    setIsConfirmModalOpen(false);
    void runReset();
  };

  const submitting = resetProfileMutation.isPending;

  const updatePreferredInputMode = (mode: QuizInputMode) => {
    setPreferredInputMode(mode);
    writeStoredInputMode(mode);
  };

  const updatePreferredQuestionDirection = (direction: QuestionDirection) => {
    setPreferredQuestionDirection(direction);
    writeStoredQuestionDirection(direction);
  };

  const updatePreferredQuestionScope = (scope: QuizScope) => {
    setPreferredQuestionScope(scope);
    writeStoredQuestionScope(scope);
  };

  const languageFlag = LANGUAGE_FLAGS[language as Language] ?? '';
  const showOfflineFallback = !isOnline && !profileQuery.data && (profileQuery.isLoading || profileQuery.isFetching || Boolean(profileQuery.error));

  if (showOfflineFallback) return <SettingsOfflineSkeleton />;

  const copyReferralLink = async () => {
    if (!referralLink) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink);
      } else {
        const input = document.createElement("textarea");
        input.value = referralLink;
        input.setAttribute("readonly", "readonly");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      setCopied(true);
      toast.success(t("settings_referral_copied"));
    } catch {
      toast.error(t("common_unexpected_error"));
    }
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;

    const shareMessage = `${t("settings_referral_share_text", { appName: topicConfig.appName })}\n\n${referralLink}`;
    const telegramShareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareMessage)}`;
    const telegramWebApp = typeof window !== "undefined" ? (window as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp : undefined;

    try {
      if (telegramWebApp?.openTelegramLink) {
        telegramWebApp.openTelegramLink(telegramShareUrl);
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: t("settings_referral_title"), text: shareMessage });
        return;
      }
    } catch {
      return;
    }

    window.open(telegramShareUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <section className="w-full space-y-4 sm:space-y-5">
        <SettingsSection>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-100">
            <span aria-hidden="true">{languageFlag}</span>
            <span>{t("settings_language_title")}</span>
          </h2>
          <div className="mt-2">
            <LanguageSwitcher onChange={setPreferredLanguage} />
          </div>
        </SettingsSection>
        <SettingsSection>
          <SectionLabel>{t("settings_referral_label")}</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-ink-100">{t("settings_referral_title")}</h2>
          <BodyText>{t("settings_referral_desc")}</BodyText>

          <div className="mt-4 rounded-xl border border-base-600 bg-base-900/50 p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-ink-500">{t("settings_referral_link_label")}</p>
            <p className="mt-1 truncate text-sm text-ink-100">{referralLink ?? t("common_loading")}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => void copyReferralLink()} disabled={!referralLink}>
              {copied ? t("settings_referral_copied_cta") : t("settings_referral_copy")}
            </Button>
            {isTelegram ? (
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => void shareReferralLink()} disabled={!referralLink}>
                {t("settings_referral_share")}
              </Button>
            ) : null}
          </div>
        </SettingsSection>
        {authMode !== "telegram" ? <SignInPanel /> : null}
        <SettingsSection>
          <SectionLabel>{t("question_mode_title")}</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-ink-100">{t("settings_quiz_mode_title")}</h2>
          <BodyText>{t("settings_quiz_mode_desc")}</BodyText>

          <div className="mt-4">
            <QuizModeControls
              inputMode={preferredInputMode}
              questionDirection={preferredQuestionDirection}
              questionScope={preferredQuestionScope}
              onInputModeChange={updatePreferredInputMode}
              onQuestionDirectionChange={updatePreferredQuestionDirection}
              onQuestionScopeChange={updatePreferredQuestionScope}
            />
          </div>
        </SettingsSection>
        {isAdmin ? (
          <SettingsSection>
            <SectionLabel>{t("admin_page_label")}</SectionLabel>
            <div className="mt-4">
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setIsAdminSettingsModalOpen(true)}>
                {t("quiz_admin_panel")}
              </Button>
            </div>
          </SettingsSection>
        ) : null}
        <SettingsSection>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionLabel>{t("profile_settings_label")}</SectionLabel>
              <h2 className="mt-2 text-lg font-semibold text-ink-100">{t("profile_reset_title")}</h2>
              <BodyText>{t("profile_reset_desc")}</BodyText>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm text-ink-200">
            <SettingsToggleRow checked={resetProgress} onToggle={setResetProgress} label={t("profile_reset_progress")} />
            <SettingsToggleRow checked={resetAttempts} onToggle={setResetAttempts} label={t("profile_reset_attempts")} />
            <SettingsToggleRow checked={deleteAccount} onToggle={setDeleteAccount} label={t("profile_delete_account")} danger />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant={deleteAccount ? "secondary" : "primary"}
              className={[
                "inline-flex w-full items-center justify-center sm:w-auto",
                !deleteAccount
                  ? "bg-pastel-coral text-base-900 hover:bg-pastel-coral/85 disabled:bg-pastel-coral/45"
                  : "",
              ].join(" ")}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? <LoadingSpinner size="sm" /> : deleteAccount ? t("profile_delete_and_reset") : t("profile_reset_selected")}
            </Button>
            {!isTelegram ? (
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={logout}>
                {t("common_sign_out")}
              </Button>
            ) : null}
          </div>

          {message ? <p className="mt-3 text-sm text-pastel-mint">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-pastel-coral">{error}</p> : null}
        </SettingsSection>
      </section>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={deleteAccount ? t("profile_delete_and_reset") : t("profile_reset_selected")}
        description={deleteAccount ? t("profile_delete_confirm") : t("profile_reset_confirm")}
        confirmLabel={deleteAccount ? t("profile_delete_and_reset") : t("profile_reset_selected")}
        cancelLabel={t("common_dismiss")}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        confirmDisabled={submitting}
      />

      <Modal
        isOpen={isAdminSettingsModalOpen}
        onClose={() => setIsAdminSettingsModalOpen(false)}
        closeLabel={t("common_dismiss")}
        showTopRightCloseButton
        maxWidthClassName="max-w-7xl"
      >
        <div className="max-h-[78vh] overflow-y-auto pr-1">
          <AdminPanel token={token} authMode={authMode} canAccess={isAdmin} pageSize={5} />
        </div>
      </Modal>
    </>
  );
}

function SettingsOfflineSkeleton() {
  return (
    <section className="w-full space-y-4 sm:space-y-5" aria-busy="true">
      <section className="w-full rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-5">
        <SkeletonText className="w-32" />
        <SkeletonBlock className="mt-3 h-10 w-48 rounded-xl" />
      </section>

      <section className="w-full rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-5">
        <SkeletonText className="w-24" />
        <SkeletonText className="mt-3 w-40" />
        <SkeletonText className="mt-2 w-3/4" />
        <SkeletonBlock className="mt-4 h-14 w-full rounded-xl" />
      </section>

      <section className="w-full rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-5">
        <SkeletonText className="w-36" />
        <SkeletonText className="mt-3 w-56" />
        <div className="mt-4 space-y-2">
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-full rounded-xl" />
        </div>
      </section>

      <OfflineStateHint />
    </section>
  );
}

type SettingsSectionProps = {
  children: ReactNode;
};

function SettingsSection({ children }: SettingsSectionProps) {
  return <section className="w-full rounded-2xl border border-base-600 bg-base-800 p-2 sm:p-3">{children}</section>;
}

type SettingsToggleRowProps = {
  checked: boolean;
  label: string;
  onToggle: (checked: boolean) => void;
  danger?: boolean;
};

function SettingsToggleRow({ checked, label, onToggle, danger = false }: SettingsToggleRowProps) {
  return (
    <label
      className={[
        "group flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 transition-colors",
        danger
          ? "border-pastel-coral/40 bg-pastel-coral/10 text-pastel-coral hover:bg-pastel-coral/15"
          : "border-base-600 bg-base-900/40 text-ink-200 hover:border-base-500 hover:bg-base-900/70",
      ].join(" ")}
    >
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onToggle(event.target.checked)}
          className={[
            "peer h-5 w-5 appearance-none rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900",
            danger
              ? "border-pastel-coral/60 bg-base-900/60 checked:border-pastel-coral checked:bg-pastel-coral/90 focus-visible:ring-pastel-coral"
              : "border-base-500 bg-base-900/80 checked:border-pastel-mint checked:bg-pastel-mint focus-visible:ring-pastel-mint",
          ].join(" ")}
        />
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="pointer-events-none absolute h-3.5 w-3.5 scale-75 text-base-900 opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
        >
          <path d="M3.2 8.4 6.6 11.6 12.8 4.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </span>
      <span className="leading-5">{label}</span>
    </label>
  );
}