"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { XIcon } from "@/components/icons";
import type { ModalProps } from "@/components/common/Modal.types";

export function Modal({ isOpen, onClose, closeLabel, showTopRightCloseButton = false, title, description, children, footer, maxWidthClassName = "max-w-md", centered = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const node = panelRef.current;
    if (!node || typeof node.animate !== "function") return;

    const animation = node.animate(
      [{ opacity: 0, transform: "translateY(12px) scale(0.97)" }, { opacity: 1, transform: "translateY(0) scale(1)" }],
      { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
    return () => animation.cancel();
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label={title ?? closeLabel}>
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 z-0 h-full w-full cursor-default bg-base-900/75 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        className={`relative z-[1001] w-full overflow-hidden rounded-3xl bg-base-800 p-4 shadow-2xl ring-1 ring-inset ring-base-600/50 sm:p-6 ${maxWidthClassName}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(80%_100%_at_50%_0%,color-mix(in_srgb,var(--color-accent-green)_14%,transparent),transparent)]"
        />
        {showTopRightCloseButton ? (
          <button
            type="button"
            aria-label={closeLabel}
            title={closeLabel}
            onClick={onClose}
            className="absolute right-3 top-3 z-[2] flex h-8 w-8 items-center justify-center rounded-xl bg-base-700/60 text-ink-300 transition-colors hover:text-ink-100"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <div className={["relative z-[1]", centered ? "text-center" : ""].join(" ")}>
          {title ? <h2 className="text-lg font-semibold text-ink-100">{title}</h2> : null}
          {description ? <p className="mt-2 text-sm text-ink-300">{description}</p> : null}
          {children ? <div className={title || description ? "mt-4" : ""}>{children}</div> : null}
          {footer ? <div className="mt-5">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
