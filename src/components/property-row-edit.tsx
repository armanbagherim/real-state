"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertyForm } from "@/components/property-form";

export function PropertyRowEdit({
  id,
  owners,
  values,
  rate,
  fileCode,
}: {
  id: string;
  owners: { id: string; fullName: string }[];
  values: Record<string, string | number | boolean>;
  rate: number;
  fileCode: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`ویرایش ${fileCode}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Pencil size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`ویرایش فایل ${fileCode}`} size="wide">
          <PropertyForm id={id} owners={owners} values={values} rate={rate} />
        </DialogContent>
      </Dialog>
    </>
  );
}
