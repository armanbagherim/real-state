"use client";
import { useState } from "react";
import { RecordForm, type Field } from "@/components/forms";
import { FormDialog } from "@/components/form-dialog";

export function NewRecordDialog({
  kind,
  title,
  triggerLabel,
  fields,
  hidden,
  values,
  wide,
}: {
  kind: string;
  title: string;
  triggerLabel: string;
  fields: Field[];
  hidden?: Record<string, string>;
  values?: Record<string, string | number | boolean>;
  wide?: boolean;
}) {
  const [now] = useState(() => new Date());
  const defaults: Record<string, string | number | boolean> = { ...values };
  if (kind === "contract") {
    defaults.startDate ??= now.toISOString();
    defaults.endDate ??= new Date(now.getTime() + 365 * 86400000).toISOString();
  }
  if (kind === "follow-up") defaults.followUpDate ??= now.toISOString();
  if (kind === "reminder") defaults.remindAt ??= now.toISOString();
  return (
    <FormDialog
      title={title}
      triggerLabel={triggerLabel}
      size={wide ? "wide" : "default"}
    >
      <RecordForm
        kind={kind}
        fields={fields}
        hidden={hidden}
        values={defaults}
      />
    </FormDialog>
  );
}
