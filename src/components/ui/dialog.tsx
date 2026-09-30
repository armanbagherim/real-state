"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export function DialogContent({
  title,
  size = "default",
  children,
}: {
  title: string;
  size?: "default" | "wide";
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="modal-overlay" />
      <DialogPrimitive.Content
        className={`modal-content${
          size === "wide" ? " modal-content-wide" : ""
        }`}
        aria-describedby={undefined}
      >
        <DialogPrimitive.Title className="section-title">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close
          className="modal-close btn btn-ghost btn-icon"
          aria-label="بستن"
        >
          <X size={20} />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
