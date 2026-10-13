"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/components/I18nProvider";
import { ChartIcon, SettingsIcon, CalendarIcon, HomeIcon, ShieldIcon } from "@/components/icons";
import type { AuthMode } from "@/lib";

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
  const { t } = useI18n();

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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-base-600/40 bg-base-900/85 backdrop-blur-md"
      style={{
        paddingBottom: "max(var(--app-content-safe-area-bottom), 10px)",
        paddingLeft: "var(--app-horizontal-safe-left)",
        paddingRight: "var(--app-horizontal-safe-right)",
      }}
    >
      <ul
        className="mx-auto grid max-w-5xl px-1 pt-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((i) => {
          const active = i.match(pathname);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "relative flex min-h-12 flex-col items-center justify-center gap-1 text-[10.5px] font-medium leading-none transition-colors",
                  active ? "text-accent-green" : "text-ink-500 hover:text-ink-300",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "absolute top-0 h-0.5 w-8 rounded-full bg-accent-green transition-opacity",
                    active ? "opacity-100 shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent-green)_70%,transparent)]" : "opacity-0",
                  ].join(" ")}
                />
                <span className={active ? "drop-shadow-[0_0_6px_color-mix(in_srgb,var(--color-accent-green)_60%,transparent)]" : ""}>
                  {i.icon}
                </span>
                <span className="max-w-full truncate whitespace-nowrap px-0.5">{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
