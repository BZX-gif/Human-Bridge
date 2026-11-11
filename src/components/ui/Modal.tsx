"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="hb-dialog-overlay fixed inset-0 z-[70] bg-black/40 backdrop-blur-md" />
        {/* Centring uses the `translate` property and the entrance animates
            `transform`, so the two compose instead of overriding each other. */}
        <Dialog.Content
          onOpenAutoFocus={(event) => {
            // Start in the first field of a form; in a confirmation, start on
            // the first (least destructive) action rather than the close button.
            const root = event.currentTarget as HTMLElement;
            const target =
              root.querySelector<HTMLElement>(
                "[data-modal-body] input:not([type=hidden]):not(:disabled), [data-modal-body] textarea:not(:disabled), [data-modal-body] select:not(:disabled)",
              ) ?? root.querySelector<HTMLElement>("[data-modal-footer] button:not(:disabled)");
            if (target) {
              event.preventDefault();
              target.focus({ preventScroll: true });
            }
          }}
          className={cn(
            "hb-dialog-content fixed left-1/2 top-1/2 z-[71] flex max-h-[90dvh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-black/5 focus:outline-none",
            width,
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
            <div className="min-w-0">
              <Dialog.Title className="text-2xl font-semibold leading-tight tracking-[-0.022em] text-ink">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-3 text-graphite transition-[background-color,transform] duration-200 ease-apple hover:bg-paper-4 active:scale-95"
              aria-label="Close"
            >
              <X size={15} strokeWidth={2.2} aria-hidden />
            </Dialog.Close>
          </div>
          <div data-modal-body className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-1">
            {children}
          </div>
          {footer && (
            <div
              data-modal-footer
              className="flex flex-wrap justify-end gap-2 border-t border-line bg-paper-2 px-6 py-4"
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
