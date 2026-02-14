"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmColor: "green" | "amber" | "blue" | "red";
  isLoading?: boolean;
}

export function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  confirmColor,
  isLoading,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getButtonVariant = (color: string) => {
    if (color === "green") return "secondary";
    if (color === "amber") return "secondary";
    if (color === "red") return "destructive";
    return "default";
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#000000]">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6">{children}</div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={getButtonVariant(confirmColor) as any}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
