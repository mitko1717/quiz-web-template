"use client";

import {
  bindMiniAppCssVars,
  bindViewportCssVars,
  disableVerticalSwipes,
  expandViewport,
  hideBackButton,
  init,
  isTMA,
  miniAppReady,
  mountBackButton,
  mountMiniAppSync,
  mountSwipeBehavior,
  mountViewport,
  onBackButtonClick,
  requestContentSafeAreaInsets,
  requestFullscreen,
  requestSafeAreaInsets,
  showBackButton,
  viewportContentSafeAreaInsets,
  viewportSafeAreaInsets,
} from "@telegram-apps/sdk-react";
import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSignal } from "@telegram-apps/sdk-react";

type Insets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type TelegramContextValue = {
  isTelegram: boolean;
  safeAreaInsets: Insets | null;
  contentSafeAreaInsets: Insets | null;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  safeAreaInsets: null,
  contentSafeAreaInsets: null,
});

const FALLBACK_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

function toInsets(input: Partial<Insets> | null | undefined): Insets {
  if (!input) return FALLBACK_INSETS;
  return { top: input.top ?? 0, right: input.right ?? 0, bottom: input.bottom ?? 0, left: input.left ?? 0 };
}

export function useTelegram() {
  return useContext(TelegramContext);
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isTelegram = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isTMA();
  }, []);

  const safeInsetsSignal = useSignal(viewportSafeAreaInsets);
  const contentSafeInsetsSignal = useSignal(viewportContentSafeAreaInsets);

  const safeInsets = useMemo(
    () => (isTelegram ? toInsets(safeInsetsSignal) : null),
    [isTelegram, safeInsetsSignal],
  );
  const contentSafeInsets = useMemo(
    () => (isTelegram ? toInsets(contentSafeInsetsSignal) : null),
    [isTelegram, contentSafeInsetsSignal],
  );

  useEffect(() => {
    if (!isTelegram) return;

    const cleanupSdk = init();
    let cleanupMiniAppCssVars: VoidFunction | undefined;
    let cleanupViewportCssVars: VoidFunction | undefined;

    try {
      if (mountMiniAppSync.isAvailable()) mountMiniAppSync();
      if (miniAppReady.isAvailable()) miniAppReady();
      if (bindMiniAppCssVars.isAvailable()) cleanupMiniAppCssVars = bindMiniAppCssVars();
      if (mountViewport.isAvailable()) void mountViewport();
      if (bindViewportCssVars.isAvailable()) cleanupViewportCssVars = bindViewportCssVars();
      if (requestSafeAreaInsets.isAvailable()) void requestSafeAreaInsets();
      if (requestContentSafeAreaInsets.isAvailable()) void requestContentSafeAreaInsets();
      
      if (requestFullscreen.isAvailable()) {
        void requestFullscreen().catch(() => {
          if (expandViewport.isAvailable()) expandViewport();
        });
      } else if (expandViewport.isAvailable()) {
        expandViewport();
      }

      if (mountSwipeBehavior.isAvailable()) mountSwipeBehavior();
      if (disableVerticalSwipes.isAvailable()) disableVerticalSwipes();
      if (mountBackButton.isAvailable()) mountBackButton();
    } catch (error) {
      console.warn("Telegram SDK initialization failed, running with browser fallback.", error);
    }

    const unbindBackHandler = onBackButtonClick.isAvailable() ? onBackButtonClick(() => router.back()) : undefined;

    return () => {
      unbindBackHandler?.();
      cleanupViewportCssVars?.();
      cleanupMiniAppCssVars?.();
      cleanupSdk?.();
    };
  }, [isTelegram, router]);

  useEffect(() => {
    if (!isTelegram) return;

    const onRootScreen = pathname === "/";
    if (onRootScreen) {
      if (hideBackButton.isAvailable()) hideBackButton();
      return;
    }

    if (showBackButton.isAvailable()) showBackButton();
  }, [isTelegram, pathname]);

  useEffect(() => {
    const root = document.documentElement;

    if (!isTelegram || !safeInsets || !contentSafeInsets) {
      root.style.removeProperty("--app-safe-area-top");
      root.style.removeProperty("--app-safe-area-right");
      root.style.removeProperty("--app-safe-area-bottom");
      root.style.removeProperty("--app-safe-area-left");
      root.style.removeProperty("--app-content-safe-area-top");
      root.style.removeProperty("--app-content-safe-area-right");
      root.style.removeProperty("--app-content-safe-area-bottom");
      root.style.removeProperty("--app-content-safe-area-left");
      root.style.removeProperty("--app-horizontal-safe-left");
      root.style.removeProperty("--app-horizontal-safe-right");
      return;
    }

    root.style.setProperty("--app-safe-area-top", `${safeInsets.top}px`);
    root.style.setProperty("--app-safe-area-right", `${safeInsets.right}px`);
    root.style.setProperty("--app-safe-area-bottom", `${safeInsets.bottom}px`);
    root.style.setProperty("--app-safe-area-left", `${safeInsets.left}px`);
    root.style.setProperty("--app-content-safe-area-top", `${contentSafeInsets.top}px`);
    root.style.setProperty("--app-content-safe-area-right", `${contentSafeInsets.right}px`);
    root.style.setProperty("--app-content-safe-area-bottom", `${contentSafeInsets.bottom}px`);
    root.style.setProperty("--app-content-safe-area-left", `${contentSafeInsets.left}px`);
    root.style.setProperty("--app-horizontal-safe-left", `${Math.max(10, safeInsets.left + 6)}px`);
    root.style.setProperty("--app-horizontal-safe-right", `${Math.max(10, safeInsets.right + 6)}px`);
  }, [isTelegram, safeInsets, contentSafeInsets]);

  const value = useMemo<TelegramContextValue>(
    () => ({
      isTelegram,
      safeAreaInsets: safeInsets,
      contentSafeAreaInsets: contentSafeInsets,
    }),
    [contentSafeInsets, isTelegram, safeInsets],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}
