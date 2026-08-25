"use client";

import { useSyncExternalStore } from "react";

let initialized = false;
let isOnlineSnapshot = true;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getBrowserOnlineValue(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function handleBrowserNetworkEvent() {
  isOnlineSnapshot = getBrowserOnlineValue();
  emitChange();
}

function ensureListenersRegistered() {
  if (initialized || typeof window === "undefined") return;

  initialized = true;
  isOnlineSnapshot = getBrowserOnlineValue();
  window.addEventListener("online", handleBrowserNetworkEvent);
  window.addEventListener("offline", handleBrowserNetworkEvent);
}

function subscribe(listener: () => void): () => void {
  ensureListenersRegistered();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  ensureListenersRegistered();
  return isOnlineSnapshot;
}

function getServerSnapshot(): boolean {
  return true;
}

export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { isOnline, isOffline: !isOnline };
}

export function isLikelyNetworkError(cause: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (cause instanceof TypeError) return true;

  if (cause instanceof Error) {
    const message = cause.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed") ||
      message.includes("load failed")
    );
  }

  return false;
}
