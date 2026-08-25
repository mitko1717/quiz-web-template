"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/providers/I18nProvider";
import { ChartIcon, SettingsIcon } from "@/components/icons/DashboardIcons";
import { CalendarIcon, HomeIcon, ShieldIcon } from "@/components/icons/FooterNavIcons";
import type { AuthMode } from "@/lib/types";

type FooterNavProps = {
  authMode: AuthMode;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match: (pathname: string) => boolean;
};

export function FooterNav({ authMode }: FooterNavProps) {
  const pathname = usePathname();
  const { t, language } = useI18n();
  const compactLocale = language !== "en";
  const navItemTrackingClass = language === "uk" ? "tracking-[0.015em]" : "tracking-[0.03em]";

  const items: NavItem[] = [
    { href: "/", label: t("nav_quiz"), icon: <HomeIcon />, match: (path) => path === "/" },
    { href: "/daily-challenge", label: t("nav_daily_challenge"), icon: <CalendarIcon />, match: (path) => path.startsWith("/daily-challenge") },
    { href: "/stats", label: t("nav_stats"), icon: <ChartIcon />, match: (path) => path.startsWith("/stats") },
    { href: "/settings", label: t("nav_settings"), icon: <SettingsIcon />, match: (path) => path.startsWith("/settings") },
  ];

  if (authMode === "localAdmin") {
    items.push({ href: "/admin", label: t("quiz_admin_panel"), icon: <ShieldIcon />, match: (path) => path.startsWith("/admin") });
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-base-600 bg-base-800/95 backdrop-blur-sm"
      style={{
        paddingBottom: "max(var(--app-content-safe-area-bottom), 10px)",
        paddingLeft: "var(--app-horizontal-safe-left)",
        paddingRight: "var(--app-horizontal-safe-right)",
      }}
    >
      <ul
        className="mx-auto grid max-w-5xl gap-1 px-0.5 py-1.5"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border px-0.5 py-1 transition-colors",
                  compactLocale ? "text-[9.5px] font-semibold" : "text-[10px] font-semibold uppercase",
                  navItemTrackingClass,
                  active
                    ? "border-accent-greenDim bg-accent-green/20 text-accent-green"
                    : "border-transparent bg-base-700/55 text-ink-300 hover:border-base-600 hover:text-ink-100",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                <span className="max-w-full text-center leading-tight whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
