"use client";

import { useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Button } from "@/components/button";
import { SectionLabel } from "@/components/SectionLabel";
import { useAuthContext } from "@/components/AuthGate";
import { useI18n } from "@/components/I18nProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTelegram } from "@/providers/TelegramProvider";

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
      <section className="w-full space-y-6">
        <div className="rounded-2xl border border-base-600 bg-base-800 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div>
              <SectionLabel>{t('admin_page_label')}</SectionLabel>
              <p className="mt-1 text-sm text-ink-300">
                {t('quiz_signed_in_as')} <span className="font-semibold text-ink-100">{username ?? t('quiz_local_admin')}</span>
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <LanguageSwitcher onChange={setPreferredLanguage} compact trigger="icon" />
              {!isTelegram ? (
                <Button className="w-full sm:w-auto" variant="secondary" size="md" onClick={openLogoutModal}>
                  {t('common_sign_out')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <AdminPanel token={token} authMode={authMode} pageSize={5} />
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
