"use client";

import { useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/button";
import { useAuthContext } from "@/components/AuthGate";
import { useI18n } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ShieldIcon } from "@/components/icons";
import { useTelegram } from "@/providers/TelegramProvider";
import { topicConfig } from "@/lib";
import { AdminGamesPanel } from "./AdminGamesPanel";

export function AdminPageContent() {
  const { t } = useI18n();
  const { isTelegram } = useTelegram();
  const { token, authMode, username, logout, setPreferredLanguage } = useAuthContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);
  const confirmLogout = () => {
    closeLogoutModal();
    logout();
  };

  return (
    <>
      <section className="w-full space-y-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-base-800/60 p-3 ring-1 ring-inset ring-base-600/40">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pastel-amber/15 text-pastel-amber">
            <ShieldIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-ink-100">{t('admin_page_label', { appName: topicConfig.appName })}</p>
            <p className="truncate text-xs text-ink-500">
              {t('quiz_signed_in_as')} <span className="font-semibold text-ink-300">{username ?? t('quiz_local_admin')}</span>
            </p>
          </div>
          <LanguageSwitcher onChange={setPreferredLanguage} compact trigger="icon" />
        </div>

        {!isTelegram ? (
          <Button className="w-full sm:w-auto" variant="ghost" size="sm" onClick={openLogoutModal}>
            {t('common_sign_out')}
          </Button>
        ) : null}

        <AdminPanel token={token} authMode={authMode} pageSize={5} />
        <AdminGamesPanel token={token} enabled={Boolean(token)} />
      </section>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title={t('logout_confirm_title')}
        description={t('logout_confirm_description')}
        confirmLabel={t('common_sign_out')}
        cancelLabel={t('common_dismiss')}
        onConfirm={confirmLogout}
        onCancel={closeLogoutModal}
      />
    </>
  );
}
