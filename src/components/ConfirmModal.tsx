"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/common/Modal";
import type { ConfirmModalProps } from "@/components/types/ConfirmModal.types";

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
  tone = "default",
  children,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      closeLabel={cancelLabel}
      title={title}
      description={description}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onCancel} className="w-full">
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={confirmDisabled} className="w-full">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}
