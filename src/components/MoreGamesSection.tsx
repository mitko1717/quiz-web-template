"use client";

import { CardSection } from "@/components/CardSection";
import { useI18n } from "@/components/I18nProvider";
import { useOtherGamesQuery } from "@/hooks/usePublicGames";

export function MoreGamesSection({ token }: { token?: string }) {
  const { t } = useI18n();
  const { data } = useOtherGamesQuery(token);
  const games = data?.games ?? [];

  if (games.length === 0) return null;

  return (
    <CardSection>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">{t("more_games_title")}</p>
      <div className="mt-3 space-y-2">
        {games.map((game) => (
          <a
            key={game.slug}
            href={game.tgBotLink ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-base-600 bg-base-700/30 p-2.5 transition hover:bg-base-700/50"
          >
            {game.iconUrl ? (
              <img src={game.iconUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 shrink-0 rounded-lg bg-base-600" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-100">{game.name}</p>
              {game.tagline ? <p className="truncate text-xs text-ink-400">{game.tagline}</p> : null}
            </div>
          </a>
        ))}
      </div>
    </CardSection>
  );
}
