"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/button";
import type { ModalProps } from "@/components/Modal.types";

export function Modal({ isOpen, onClose, closeLabel, showTopRightCloseButton = false, title, description, children, footer, maxWidthClassName = "max-w-md" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label={title ?? closeLabel}>
      <Button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        variant="ghost"
        className="absolute inset-0 z-0 h-full w-full rounded-none border-0 bg-base-950/70 p-0 backdrop-blur-[1px] hover:bg-base-950/70"
      >
        <span className="sr-only">{closeLabel}</span>
      </Button>
      <div className={`relative z-[1001] w-full rounded-2xl border border-base-600 bg-base-800 p-5 shadow-2xl sm:p-6 ${maxWidthClassName}`}>
        {showTopRightCloseButton ? (
          <Button
            type="button"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 h-8 w-8 rounded-full p-0 text-lg leading-none"
          >
            ×
          </Button>
        ) : null}
        {title ? <h2 className="text-lg font-semibold text-ink-100">{title}</h2> : null}
        {description ? <p className="mt-2 text-sm text-ink-300">{description}</p> : null}
        {children ? <div className={title || description ? "mt-3" : ""}>{children}</div> : null}
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}