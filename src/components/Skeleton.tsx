"use client";

import { useI18n } from "@/providers/I18nProvider";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonBlockProps) {
  return <div className={["animate-pulse rounded-lg bg-base-600/55", className].join(" ").trim()} aria-hidden="true" />;
}

export function SkeletonText({ className = "" }: SkeletonBlockProps) {
  return <SkeletonBlock className={["h-3 rounded-full", className].join(" ").trim()} />;
}

export function OfflineStateHint({ className = "" }: SkeletonBlockProps) {
  const { t } = useI18n();

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "rounded-xl border border-pastel-amber/50 bg-pastel-amber/12 p-3 text-sm text-pastel-amber",
        className,
      ].join(" ").trim()}
    >
      <p className="font-semibold">{t("offline_notice_title")}</p>
      <p className="mt-1 inline-flex items-center gap-2 text-xs text-ink-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-pastel-amber" aria-hidden="true" />
        {t("offline_notice_retrying")}
      </p>
    </div>
  );
}
