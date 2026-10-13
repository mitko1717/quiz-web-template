"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
import type { ToastEntry, ToastItemProps, ToastType } from "./toast.types";

export type { ToastType } from "./toast.types";

let nextId = 1;
let globalAddToast: ((message: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "info") {
  globalAddToast?.(message, type);
}
toast.success = (message: string) => toast(message, "success");
toast.error = (message: string) => toast(message, "error");

const TONE: Record<ToastType, string> = {
  success: "ring-pastel-mint/40",
  error: "ring-pastel-coral/40",
  info: "ring-base-600/50",
};

const ICON_TONE: Record<ToastType, string> = {
  success: "bg-pastel-mint text-base-900",
  error: "bg-pastel-coral text-base-900",
  info: "bg-accent-green/20 text-accent-green",
};

function ToastItem({ entry, onRemove }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(onRemove, 3500);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <div
      className={["flex items-center gap-2.5 rounded-2xl bg-base-800/95 px-3.5 py-3 text-sm text-ink-100 shadow-lg ring-1 ring-inset backdrop-blur-md transition-all", TONE[entry.type]].join(" ")}
      role="status"
    >
      <span className={["flex h-5 w-5 shrink-0 items-center justify-center rounded-full", ICON_TONE[entry.type]].join(" ")}>
        {entry.type === "success" ? <CheckIcon className="h-3 w-3" /> : entry.type === "error" ? <XIcon className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className="min-w-0">{entry.message}</span>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const addToast = useCallback((message: string, type: ToastType) => {
    setToasts(prev => [...prev, { id: nextId++, message, type }]);
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => { globalAddToast = null; };
  }, [addToast]);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed z-50 flex w-[min(92vw,360px)] flex-col gap-2 sm:right-6"
      style={{
        right: "max(var(--app-horizontal-safe-right), 1rem)",
        left: "max(var(--app-horizontal-safe-left), 1rem)",
        bottom: "var(--app-toast-bottom-offset)",
      }}
      aria-live="polite"
    >
      {toasts.map(e => (
        <ToastItem key={e.id} entry={e} onRemove={() => remove(e.id)} />
      ))}
    </div>
  );
}
