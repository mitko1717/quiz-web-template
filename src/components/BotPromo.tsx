"use client";

import { Button } from "@/components/button";
import { openTelegramLink } from "@/lib/open-telegram-link";

// Optional per-clone promo of a related bot, configured only by env so `npm run sync`
// never wipes it. No NEXT_PUBLIC_PROMO_BOT_URL => nothing is rendered.
const PROMO = {
  url: process.env.NEXT_PUBLIC_PROMO_BOT_URL?.trim() || null,
  title: process.env.NEXT_PUBLIC_PROMO_TITLE?.trim() || "",
  settingsTitle: process.env.NEXT_PUBLIC_PROMO_SETTINGS_TITLE?.trim() || "",
  text: process.env.NEXT_PUBLIC_PROMO_TEXT?.trim() || "",
  button: process.env.NEXT_PUBLIC_PROMO_BUTTON?.trim() || "",
  extraUrl: process.env.NEXT_PUBLIC_PROMO_EXTRA_URL?.trim() || null,
  extraText: process.env.NEXT_PUBLIC_PROMO_EXTRA_TEXT?.trim() || ""
};

export const botPromoEnabled = PROMO.url !== null;

export const botPromoSettingsTitle = PROMO.settingsTitle || PROMO.title;

interface BotPromoProps {
  showTitle?: boolean;
  className?: string;
}

export function BotPromo({ showTitle = false, className }: BotPromoProps) {
  if (!PROMO.url) return null;

  const promoUrl = PROMO.url;
  const extraUrl = PROMO.extraUrl;
  const openBot = () => openTelegramLink(promoUrl);
  const openExtra = () => {
    if (extraUrl) openTelegramLink(extraUrl);
  };

  return (
    <div className={className}>
      {showTitle && PROMO.title ? <p className="text-sm font-semibold">{PROMO.title}</p> : null}
      {PROMO.text ? <p className="mt-1 text-sm text-ink-500">{PROMO.text}</p> : null}
      <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" onClick={openBot}>
        {PROMO.button}
      </Button>
      {extraUrl && PROMO.extraText ? (
        <button type="button" className="mt-2 w-full text-xs text-ink-500 underline-offset-2 hover:underline" onClick={openExtra}>
          {PROMO.extraText}
        </button>
      ) : null}
    </div>
  );
}
