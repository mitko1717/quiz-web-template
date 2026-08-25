"use client";

import { Button } from "@/components/button";
import { Modal } from "@/components/Modal";
import type { ConfirmModalProps } from "@/components/ConfirmModal.types";

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
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
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
          <Button variant="secondary" onClick={onConfirm} disabled={confirmDisabled} className="w-full sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children}
    </Modal>
  );
}