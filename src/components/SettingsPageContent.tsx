"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useAuthContext } from "@/components/AuthGate";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { AdminPanel } from "@/components/AdminPanel";
import { OfflineStateHint, SkeletonBlock, SkeletonText } from "@/components/common/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/button";
import { SignInPanel } from "@/components/SignInPanel";
import { QuizModeControls } from "@/components/QuizModeControls";
import { readStoredInputMode, readStoredQuestionDirection, readStoredQuestionScope, writeStoredInputMode, writeStoredQuestionDirection, writeStoredQuestionScope, QuestionDirection, QuizScope, QuizInputMode, Language, topicConfig, shareViaTelegram, LANGUAGE_FLAGS } from "@/lib";
import { useProfileQuery, useResetProfileMutation, useReferralLink, useNetworkStatus } from "@/hooks";
import { useTelegram } from "@/providers/TelegramProvider";
import { toast } from "@/components/toast";
import { CheckIcon, CopyIcon, GlobeIcon, LinkIcon, ModeIcon, ShareIcon, ShieldIcon, TrashIcon } from "@/components/icons";

const SECTION_TONES = {
  accent: "bg-accent-green/15 text-accent-green",
  mint: "bg-pastel-mint/15 text-pastel-mint",
  coral: "bg-pastel-coral/15 text-pastel-coral",
  amber: "bg-pastel-amber/15 text-pastel-amber",
  sky: "bg-pastel-sky/15 text-pastel-sky",
} as const;

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

  const referralLink = useReferralLink(profileQuery.data);

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
    await shareViaTelegram(shareMessage);
  };

  const copyLabel = copied ? t("settings_referral_copied_cta") : t("settings_referral_copy");

  return (
    <>
      <section className="w-full space-y-2.5 sm:space-y-3">
        {topicConfig.languages.length > 1 ? (
        <SettingsSection>
          <SectionHeader
            tone="sky"
            icon={<GlobeIcon className="h-4 w-4" />}
            title={t("settings_language_title")}
            extra={languageFlag ? <span aria-hidden="true" className="text-lg leading-none">{languageFlag}</span> : null}
          />
          <div className="mt-3">
            <LanguageSwitcher onChange={setPreferredLanguage} />
          </div>
        </SettingsSection>
        ) : null}

        <SettingsSection>
          <SectionHeader tone="mint" icon={<ShareIcon className="h-4 w-4" />} title={t("settings_referral_title")} />
          <p className="mt-2 text-sm text-ink-300">{t("settings_referral_desc")}</p>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-base-900/50 py-1.5 pl-3 pr-1.5 ring-1 ring-inset ring-base-600/40">
            <LinkIcon className="h-4 w-4 shrink-0 text-ink-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-ink-500">{t("settings_referral_link_label")}</p>
              <p className="truncate text-sm text-ink-100">{referralLink ?? t("common_loading")}</p>
            </div>
            <button
              type="button"
              onClick={() => void copyReferralLink()}
              disabled={!referralLink}
              aria-label={copyLabel}
              title={copyLabel}
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
                copied ? "bg-pastel-mint/20 text-pastel-mint" : "bg-accent-green/10 text-accent-green hover:bg-accent-green/20",
              ].join(" ")}
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            </button>
          </div>

          {isTelegram ? (
            <Button type="button" variant="primary" className="mt-3 flex w-full items-center justify-center gap-2" onClick={() => void shareReferralLink()} disabled={!referralLink}>
              <ShareIcon className="h-4 w-4" />
              {t("settings_referral_share")}
            </Button>
          ) : null}
        </SettingsSection>

        {authMode !== "telegram" ? <SignInPanel /> : null}

        <SettingsSection>
          <SectionHeader tone="accent" icon={<ModeIcon className="h-4 w-4" />} title={t("settings_quiz_mode_title")} />
          <p className="mt-2 text-sm text-ink-300">{t("settings_quiz_mode_desc")}</p>

          <div className="mt-3">
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
            <SectionHeader tone="amber" icon={<ShieldIcon />} title={t("admin_page_label", { appName: topicConfig.appName })} />
            <Button type="button" variant="secondary" className="mt-3 w-full sm:w-auto" onClick={() => setIsAdminSettingsModalOpen(true)}>
              {t("quiz_admin_panel")}
            </Button>
          </SettingsSection>
        ) : null}

        <SettingsSection>
          <SectionHeader tone="coral" icon={<TrashIcon className="h-4 w-4" />} title={t("profile_reset_title")} />
          <p className="mt-2 text-sm text-ink-300">{t("profile_reset_desc")}</p>

          <div className="mt-3 space-y-1.5 text-sm">
            <SettingsToggleRow checked={resetProgress} onToggle={setResetProgress} label={t("profile_reset_progress")} />
            <SettingsToggleRow checked={resetAttempts} onToggle={setResetAttempts} label={t("profile_reset_attempts")} />
            <SettingsToggleRow checked={deleteAccount} onToggle={setDeleteAccount} label={t("profile_delete_account")} danger />
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="danger"
              className="inline-flex w-full items-center justify-center sm:w-auto"
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
        tone="danger"
      />

      <Modal
        isOpen={isAdminSettingsModalOpen}
        onClose={() => setIsAdminSettingsModalOpen(false)}
        closeLabel={t("common_dismiss")}
        title={t("quiz_admin_panel")}
        showTopRightCloseButton
        maxWidthClassName="max-w-7xl"
      >
        <div className="max-h-[78vh] min-w-0 overflow-y-auto overflow-x-hidden">
          <AdminPanel token={token} authMode={authMode} canAccess={isAdmin} pageSize={5} />
        </div>
      </Modal>
    </>
  );
}

function SettingsOfflineSkeleton() {
  return (
    <section className="w-full space-y-2.5 sm:space-y-3" aria-busy="true">
      <SettingsSection>
        <SkeletonText className="w-32" />
        <SkeletonBlock className="mt-3 h-10 w-48 rounded-xl" />
      </SettingsSection>

      <SettingsSection>
        <SkeletonText className="w-24" />
        <SkeletonText className="mt-3 w-40" />
        <SkeletonText className="mt-2 w-3/4" />
        <SkeletonBlock className="mt-4 h-14 w-full rounded-xl" />
      </SettingsSection>

      <SettingsSection>
        <SkeletonText className="w-36" />
        <SkeletonText className="mt-3 w-56" />
        <div className="mt-4 space-y-2">
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-full rounded-xl" />
          <SkeletonBlock className="h-12 w-full rounded-xl" />
        </div>
      </SettingsSection>

      <OfflineStateHint />
    </section>
  );
}

type SettingsSectionProps = {
  children: ReactNode;
};

function SettingsSection({ children }: SettingsSectionProps) {
  return <section className="w-full rounded-2xl bg-base-800/60 p-3 ring-1 ring-inset ring-base-600/40 sm:p-4">{children}</section>;
}

type SectionHeaderProps = {
  tone: keyof typeof SECTION_TONES;
  icon: ReactNode;
  title: string;
  extra?: ReactNode;
};

function SectionHeader({ tone, icon, title, extra }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", SECTION_TONES[tone]].join(" ")}>{icon}</span>
      <h2 className="min-w-0 flex-1 text-base font-semibold text-ink-100">{title}</h2>
      {extra}
    </div>
  );
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
        "group flex cursor-pointer items-start gap-3 rounded-xl p-2.5 transition-colors",
        danger
          ? "bg-pastel-coral/10 text-pastel-coral ring-1 ring-inset ring-pastel-coral/30 hover:bg-pastel-coral/15"
          : "bg-base-700/40 text-ink-100 hover:bg-base-700/60",
      ].join(" ")}
    >
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className={[
            "peer h-5 w-5 appearance-none rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900",
            danger
              ? "border-pastel-coral/60 bg-base-900/60 checked:border-pastel-coral checked:bg-pastel-coral/90 focus-visible:ring-pastel-coral"
              : "border-ink-500/60 bg-base-900/80 checked:border-accent-green checked:bg-accent-green focus-visible:ring-accent-green",
          ].join(" ")}
        />
        <CheckIcon className="pointer-events-none absolute scale-75 text-base-900 opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100" />
      </span>
      <span className="leading-5">{label}</span>
    </label>
  );
}
