"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type AdsgramShowResult = {
  done?: boolean;
  description?: string;
  state?: string;
  error?: boolean;
};

type AdsgramEvent =
  | "onStart"
  | "onSkip"
  | "onReward"
  | "onComplete"
  | "onError"
  | "onBannerNotFound"
  | "onNonStopShow"
  | "onTooLongSession";

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: AdsgramEvent, callback: () => void) => void;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
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

// After a block-level failure (inactive block, render error, too-long session) the block is
// skipped entirely — the SDK script isn't even loaded — so the user never sees the SDK's
// own error popup again for this cooldown window.
const BLOCK_ERROR_COOLDOWN_MS = 3 * 60 * 60 * 1000;
const NO_FILL_COOLDOWN_MS = 30 * 60 * 1000;
const disabledKey = (blockId: string) => `adsgram_disabled_until:${blockId}`;

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

function isBlockDisabled(blockId: string): boolean {
  try {
    const until = Number(localStorage.getItem(disabledKey(blockId)) ?? "0");
    return Date.now() < until;
  } catch {
    return false;
  }
}

function disableBlock(blockId: string, durationMs: number): void {
  try {
    localStorage.setItem(disabledKey(blockId), String(Date.now() + durationMs));
  } catch {
    // localStorage unavailable — nothing to persist.
  }
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

// init() returns the same controller for the same blockId, so listeners are attached once
// per block. Subscribing to these events also suppresses the SDK's default alerts.
const listenersAttached = new Set<string>();

function attachSilentListeners(controller: AdsgramController, blockId: string): void {
  if (listenersAttached.has(blockId) || typeof controller.addEventListener !== "function") return;
  listenersAttached.add(blockId);
  controller.addEventListener("onError", () => disableBlock(blockId, BLOCK_ERROR_COOLDOWN_MS));
  controller.addEventListener("onTooLongSession", () => disableBlock(blockId, BLOCK_ERROR_COOLDOWN_MS));
  controller.addEventListener("onBannerNotFound", () => disableBlock(blockId, NO_FILL_COOLDOWN_MS));
  controller.addEventListener("onNonStopShow", () => undefined);
}

function isEligible(blockId: string): boolean {
  return Boolean(blockId) && isOnline() && !isBlockDisabled(blockId) && canShowNow();
}

export function AdsgramBanner({ blockId, onReward, placement }: AdsgramBannerProps) {
  const resolvedBlockId = blockId ?? process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID ?? "";
  const [eligible, setEligible] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const shownRef = useRef(false);

  // Decided on the client only (navigator/localStorage); until then nothing is loaded.
  useEffect(() => {
    if (isEligible(resolvedBlockId)) setEligible(true);
  }, [resolvedBlockId]);

  useEffect(() => {
    if (!eligible || !sdkReady || sdkFailed || shownRef.current) return;
    if (!isEligible(resolvedBlockId)) return;
    if (!window.Adsgram) {
      setSdkFailed(true);
      return;
    }

    shownRef.current = true;
    markShown();

    try {
      const controller = window.Adsgram.init({ blockId: resolvedBlockId });
      attachSilentListeners(controller, resolvedBlockId);
      controller
        .show()
        .then(() => onReward?.())
        .catch((result: AdsgramShowResult | undefined) => {
          // Skip/close rejects with error=false — that's normal. Only real errors disable the block.
          if (result?.error) disableBlock(resolvedBlockId, BLOCK_ERROR_COOLDOWN_MS);
        });
    } catch {
      disableBlock(resolvedBlockId, BLOCK_ERROR_COOLDOWN_MS);
      setSdkFailed(true);
    }
  }, [eligible, resolvedBlockId, sdkReady, sdkFailed, onReward, placement]);

  if (!resolvedBlockId || !eligible || sdkFailed) return null;

  return (
    <Script
      src="https://sad.adsgram.ai/js/sad.min.js"
      strategy="afterInteractive"
      onReady={() => setSdkReady(true)}
      onError={() => {
        disableBlock(resolvedBlockId, NO_FILL_COOLDOWN_MS);
        setSdkFailed(true);
      }}
    />
  );
}
