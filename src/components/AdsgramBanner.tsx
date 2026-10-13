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
};

const SESSION_SHOWN_KEY = "adsgram_shown_this_session";
const LAST_SHOWN_AT_KEY = "adsgram_last_shown_at";
const MIN_INTERVAL_MS = 2 * 60 * 1000;

function isInsideTelegram(): boolean {
  if (typeof window === "undefined") return false;
  const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  return Boolean(tg?.initData);
}

// Only one ad across the whole app per Mini App session, at least 2 minutes apart —
// several AdsgramBanner instances can be mounted on the same page (hint popup, daily
// challenge, home), so this guard lives outside React state to cover all of them.
function canShowNow(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_SHOWN_KEY)) return false;
    const lastShownAt = Number(sessionStorage.getItem(LAST_SHOWN_AT_KEY) ?? "0");
    return Date.now() - lastShownAt >= MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markShown(): void {
  try {
    sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
    sessionStorage.setItem(LAST_SHOWN_AT_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable — skip throttling, better than crashing.
  }
}

export function AdsgramBanner({ blockId, className = "", label = "", onReward }: AdsgramBannerProps) {
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
    if (!canShowNow()) return;
    if (!window.Adsgram) {
      setSdkFailed(true);
      return;
    }
    shownRef.current = true;
    markShown();
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
  }, [resolvedBlockId, sdkReady, sdkFailed, inTelegram, onReward]);

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
