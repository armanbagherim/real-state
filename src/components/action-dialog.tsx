"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { FolderSelect, type FolderOption } from "./folder-select";

export type ActionResult = { error?: string; success?: string };

export type DialogField =
  | {
      type: "text";
      name: string;
      label: string;
      defaultValue?: string;
      placeholder?: string;
      autoFocus?: boolean;
      maxLength?: number;
    }
  | {
      type: "color";
      name: string;
      label: string;
      defaultValue?: string;
    }
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      defaultValue?: string;
    }
  | {
      type: "folders";
      name: string;
      label: string;
      options: FolderOption[];
      value?: string | null;
      excludeId?: string;
      noneLabel?: string;
    };

/**
 * Dialog wrapper for server actions: owns open state, shows inline errors,
 * toasts on success and closes itself. Success closes the dialog by adjusting
 * state during render (no effect-driven setState), and toasts fire from the
 * action itself so no work happens in an effect.
 */
export function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  action,
  initialState,
  fields,
  hidden,
  submitLabel,
  pendingLabel = "در حال انجام…",
  submitVariant = "default",
  note,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  initialState?: ActionResult;
  fields: DialogField[];
  hidden?: Record<string, string | string[]>;
  submitLabel: string;
  pendingLabel?: string;
  submitVariant?: "default" | "destructive";
  note?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionResult, form: FormData) => {
      const result = await action(prev, form);
      if (result.success) {
        toast.success(result.success);
        onSuccess?.();
      }
      return result;
    },
    initialState ?? {},
  );

  // Render-phase adjustment: close as soon as a new success lands.
  if (state.success && state.success !== lastSuccess) {
    setLastSuccess(state.success);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title}>
        <form action={formAction} className="record-form">
          {hidden &&
            Object.entries(hidden).map(([name, value]) =>
              Array.isArray(value) ? (
                value.map((item) => (
                  <input
                    key={`${name}-${item}`}
                    type="hidden"
                    name={name}
                    value={item}
                  />
                ))
              ) : (
                <input key={name} type="hidden" name={name} value={value} />
              ),
            )}
          {fields.map((field) => (
            <FieldInput key={field.name} field={field} />
          ))}
          {note}
          {state.error && <p className="field-error">{state.error}</p>}
          <div className="form-footer">
            <Button type="submit" variant={submitVariant} disabled={pending}>
              {pending && <Loader2 className="spin" size={16} />}
              {pending ? pendingLabel : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              انصراف
            </Button>
          </div>
        </form>
        {description && <p className="muted-note">{description}</p>}
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ field }: { field: DialogField }) {
  if (field.type === "folders")
    return (
      <label>
        {field.label}
        <FolderSelect
          name={field.name}
          value={field.value}
          options={field.options}
          excludeId={field.excludeId}
          noneLabel={field.noneLabel}
        />
      </label>
    );
  if (field.type === "select")
    return (
      <label>
        {field.label}
        <select
          name={field.name}
          defaultValue={field.defaultValue ?? ""}
          required
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (field.type === "color")
    return (
      <label>
        {field.label}
        <input
          type="color"
          name={field.name}
          defaultValue={field.defaultValue ?? "#147d70"}
        />
      </label>
    );
  return (
    <label>
      {field.label}
      <input
        type="text"
        name={field.name}
        defaultValue={field.defaultValue ?? ""}
        placeholder={field.placeholder}
        autoFocus={field.autoFocus}
        maxLength={field.maxLength}
        required
      />
    </label>
  );
}
