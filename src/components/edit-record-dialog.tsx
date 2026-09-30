"use client";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { RecordForm, type Field } from "@/components/forms";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function EditRecordDialog({
  kind,
  title,
  fields,
  hidden,
  values,
  label = "ویرایش",
  size = "default",
}: {
  kind: string;
  title: string;
  fields: Field[];
  hidden?: Record<string, string>;
  values?: Record<string, string | number | boolean>;
  label?: string;
  size?: "default" | "wide";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={label}
        title={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Pencil size={16} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={title} size={size}>
          <RecordForm
            kind={kind}
            fields={fields}
            hidden={hidden}
            values={values}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
