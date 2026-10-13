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

export function AdsgramBanner({ blockId, className = "", label = "", onReward }: AdsgramBannerProps) {
  const resolvedBlockId = blockId ?? process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID ?? "";
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (!resolvedBlockId || !sdkReady || sdkFailed || shownRef.current) return;
    if (!window.Adsgram) {
      setSdkFailed(true);
      return;
    }
    shownRef.current = true;
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
  }, [resolvedBlockId, sdkReady, sdkFailed, onReward]);

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
