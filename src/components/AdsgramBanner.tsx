"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: { blockId: string }) => {
        show: () => Promise<unknown>;
      };
    };
  }
}

type AdsgramBannerProps = {
  blockId?: string;
  className?: string;
  label?: string;
  onReward?: () => void;
  placement: string;
};

const MIN_INTERVAL_MS = 2 * 60 * 1000;

function isInsideTelegram(): boolean {
  if (typeof window === "undefined") return false;
  const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  return Boolean(tg?.initData);
}

// Each placement (home, daily challenge, hint popup) throttles itself independently,
// at least 2 minutes apart — so visiting one place doesn't block ads on another.
function canShowNow(placementKey: string): boolean {
  try {
    const lastShownAt = Number(sessionStorage.getItem(`adsgram_last_shown_${placementKey}`) ?? "0");
    return Date.now() - lastShownAt >= MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markShown(placementKey: string): void {
  try {
    sessionStorage.setItem(`adsgram_last_shown_${placementKey}`, String(Date.now()));
  } catch {
    // sessionStorage unavailable — skip throttling, better than crashing.
  }
}

export function AdsgramBanner({ blockId, className = "", label = "", onReward, placement }: AdsgramBannerProps) {
  const resolvedBlockId = blockId ?? process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID ?? "";
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [inTelegram, setInTelegram] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    setInTelegram(isInsideTelegram());
  }, []);

  useEffect(() => {
    if (!resolvedBlockId || !sdkReady || sdkFailed || !inTelegram || shownRef.current) return;
    if (!canShowNow(placement)) return;
    if (!window.Adsgram) {
      setSdkFailed(true);
      return;
    }
    shownRef.current = true;
    markShown(placement);
    try {
      const controller = window.Adsgram.init({ blockId: resolvedBlockId });
      controller
        .show()
        .then(() => onReward?.())
        .catch(() => {
          // Ad failed to load or was dismissed — fail silently, no layout shift.
        });
    } catch {
      setSdkFailed(true);
    }
  }, [resolvedBlockId, sdkReady, sdkFailed, inTelegram, onReward, placement]);

  if (!resolvedBlockId || sdkFailed || !inTelegram) return null;

  return (
    <Script
      src="https://sad.adsgram.ai/js/sad.min.js"
      strategy="afterInteractive"
      onReady={() => setSdkReady(true)}
      onError={() => setSdkFailed(true)}
    />
  );
}
