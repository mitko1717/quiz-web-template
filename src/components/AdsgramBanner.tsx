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

const MIN_INTERVAL_MS = 5 * 60 * 1000;
const LAST_SHOWN_AT_KEY = "adsgram_last_shown_at";

// One shared timer across every placement (home, daily challenge, hint popup) —
// showing an ad anywhere starts a 5-minute cooldown for all of them.
function canShowNow(): boolean {
  try {
    const lastShownAt = Number(sessionStorage.getItem(LAST_SHOWN_AT_KEY) ?? "0");
    return Date.now() - lastShownAt >= MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markShown(): void {
  try {
    sessionStorage.setItem(LAST_SHOWN_AT_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable — skip throttling, better than crashing.
  }
}

export function AdsgramBanner({ blockId, className = "", label = "", onReward, placement }: AdsgramBannerProps) {
  const resolvedBlockId = blockId ?? process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID ?? "";
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!resolvedBlockId || !sdkReady || sdkFailed || shownRef.current) return;
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
  }, [resolvedBlockId, sdkReady, sdkFailed, onReward, placement]);

  if (!resolvedBlockId || sdkFailed) return null;

  return (
    <Script
      src="https://sad.adsgram.ai/js/sad.min.js"
      strategy="afterInteractive"
      onReady={() => setSdkReady(true)}
      onError={() => setSdkFailed(true)}
    />
  );
}
