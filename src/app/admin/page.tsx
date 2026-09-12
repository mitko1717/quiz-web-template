"use client";

import { AdminPageContent } from "@/components/AdminPageContent";
import { useAuthContext } from "@/components/AuthGate";
import { useI18n } from "@/components/I18nProvider";
import { PageWrapper } from "@/components/PageWrapper";

export default function AdminPage() {
  const { authMode, isAdmin } = useAuthContext();
  const { t } = useI18n();

  if (authMode !== "localAdmin" && !isAdmin) {
    return (
      <PageWrapper>
        <div className="auth-page flex flex-col items-center justify-center bg-base-900 px-4 text-center text-ink-300 sm:px-6">
          <p>{t('auth_admin_access_required')}</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <AdminPageContent />
    </PageWrapper>
  );
}