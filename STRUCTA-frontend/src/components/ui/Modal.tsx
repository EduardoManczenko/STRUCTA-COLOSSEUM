"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
}

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => closeOnBackdrop && onClose()}
            className="absolute inset-0 bg-dark-950/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "relative z-10 m-3 w-full rounded-3xl border border-dark-600 bg-dark-800 shadow-2xl shadow-purple-500/10 sm:m-0",
              SIZES[size],
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-dark-700 p-5 sm:p-6">
                <div>
                  {title && (
                    <h2 className="font-heading text-xl font-bold tracking-tight text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-400">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="-mr-1 -mt-1 rounded-lg border border-transparent p-1.5 text-gray-400 transition hover:border-dark-600 hover:bg-dark-900 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
            <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
              {children}
            </div>
            {footer && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dark-700 p-5 sm:p-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
