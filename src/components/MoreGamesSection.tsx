"use client";

import { CardSection } from "@/components/types/CardSection";
import { useI18n } from "@/components/I18nProvider";
import { useOtherGamesQuery } from "@/hooks";
import { ChevronRightIcon } from "@/components/icons";
import type { MouseEvent } from "react";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useTelegram } from "@/providers/TelegramProvider";
import { isSafeExternalLink, isSafeImageUrl, isSafeWebLink } from "@/lib/url-safety";

export function MoreGamesSection({ token }: { token?: string }) {
  const { t } = useI18n();
  const { data } = useOtherGamesQuery(token);
  // Same detection as the rest of the app (SDK launch params), not window.Telegram, which the
  // SDK-based app doesn't load — that made Mini App users land on the web versions.
  const { isTelegram: inTelegram } = useTelegram();

  const openInTelegram = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!inTelegram || !openTelegramLink.isAvailable()) return;

    event.preventDefault();
    openTelegramLink(href);
  };
  // Telegram → bot link; plain browser → web version (falls back to bot if none).
  const games = (data?.games ?? []).map((game) => {
    const href = !inTelegram && isSafeWebLink(game.webUrl) ? game.webUrl : isSafeExternalLink(game.tgBotLink) ? game.tgBotLink : null;
    return { ...game, href };
  }).filter((game): game is typeof game & { href: string } => game.href !== null);

  if (games.length === 0) return null;

  return (
    <CardSection>
      <p className="text-xs font-medium text-ink-500">{t("more_games_title")}</p>
      <div className="mt-2.5 space-y-1.5">
        {games.map((game) => (
          <a
            key={game.slug}
            href={game.href}
            onClick={(event) => openInTelegram(event, game.href)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-base-700/40 p-2.5 transition-colors hover:bg-base-700/60"
          >
            {isSafeImageUrl(game.logo) ? (
              <img src={game.logo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-xl bg-base-600" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-100">{game.name}</p>
              {game.tagline ? <p className="truncate text-xs text-ink-500">{game.tagline}</p> : null}
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-500" />
          </a>
        ))}
      </div>
    </CardSection>
  );
}
