"use client";

import { useState } from "react";
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

export function AdsgramBanner({ blockId, className = "", label = "🎬 Watch an ad", onReward }: AdsgramBannerProps) {
  const resolvedBlockId = blockId ?? process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID ?? "";
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (!resolvedBlockId || sdkFailed || hidden) return null;

  const handleShow = () => {
    if (!window.Adsgram) {
      setSdkFailed(true);
      return;
    }
    setPending(true);
    try {
      const controller = window.Adsgram.init({ blockId: resolvedBlockId });
      controller
        .show()
        .then(() => onReward?.())
        .catch(() => {
          // User skipped or ad failed to load — fail silently, no layout shift.
        })
        .finally(() => setPending(false));
    } catch {
      setSdkFailed(true);
      setPending(false);
    }
  };

  return (
    <>
      <Script
        src="https://adsgram.ai/js/adsgram-ad.js"
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
        onError={() => setSdkFailed(true)}
      />
      <button
        type="button"
        disabled={!sdkReady || pending}
        onClick={handleShow}
        className={[
          "w-full rounded-xl border border-base-600 bg-base-700/40 px-3 py-2 text-center text-xs text-ink-300",
          "transition-colors hover:bg-base-700/60 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ].join(" ")}
      >
        {pending ? "..." : label}
      </button>
    </>
  );
}
