"use client";

import { useCallback, useEffect, useState } from "react";
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
  success: "border-pastel-mint/40 bg-pastel-mint/10 text-pastel-mint",
  error: "border-pastel-coral/40 bg-pastel-coral/10 text-pastel-coral",
  info: "border-base-600 bg-base-700/60 text-ink-200",
};

function ToastItem({ entry, onRemove }: ToastItemProps) {
  useEffect(() => {
    const t = setTimeout(onRemove, 3500);
    return () => clearTimeout(t);
  }, [onRemove]);

  return (
    <div className={["rounded-xl border px-4 py-3 text-sm shadow-lg transition-all", TONE[entry.type]].join(" ")} role="status">
      {entry.message}
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
