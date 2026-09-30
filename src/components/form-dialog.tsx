"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function FormDialog({
  title,
  triggerLabel,
  size = "default",
  children,
}: {
  title: string;
  triggerLabel: string;
  size?: "default" | "wide";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus size={18} />
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={title} size={size}>
          {children}
        </DialogContent>
      </Dialog>
    </>
  );
}
