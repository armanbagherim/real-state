"use client";
import { useActionState, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { savePackage } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/actions/manage";

const empty: ActionResult = {};

type Pkg = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  propertyLimit: number;
  agentLimit: number;
  color: string;
  badge: string;
  active: boolean;
};

const SWATCHES = [
  "#147d70",
  "#0f5f8f",
  "#7a3fbf",
  "#b8365f",
  "#c2700f",
  "#2f7a1f",
  "#0f5f5f",
  "#4a5568",
];

export function PackageForm({ pkg }: { pkg?: Pkg }) {
  const [state, action, pending] = useActionState(savePackage, empty);
  const [open, setOpen] = useState(!pkg);
  if (!open)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil size={14} />
        ویرایش
      </Button>
    );
  return (
    <form action={action} className="package-form">
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <label>
        نام پکیج
        <input name="name" defaultValue={pkg?.name} required />
      </label>
      <label>
        توضیح
        <textarea name="description" rows={2} defaultValue={pkg?.description} />
      </label>
      <div className="form-grid-2">
        <label>
          قیمت ماهانه (تومان)
          <input
            name="monthlyPrice"
            inputMode="numeric"
            defaultValue={pkg?.monthlyPrice}
            required
          />
        </label>
        <label>
          قیمت سالانه (تومان)
          <input
            name="yearlyPrice"
            inputMode="numeric"
            defaultValue={pkg?.yearlyPrice}
            required
          />
        </label>
        <label>
          سقف فایل
          <input
            name="propertyLimit"
            inputMode="numeric"
            defaultValue={pkg?.propertyLimit}
            required
          />
        </label>
        <label>
          سقف مشاور
          <input
            name="agentLimit"
            inputMode="numeric"
            defaultValue={pkg?.agentLimit}
            required
          />
        </label>
      </div>
      <label>
        برچسب (اختیاری)
        <input name="badge" defaultValue={pkg?.badge} placeholder="پرطرفدار" />
      </label>
      <label className="color-field">
        رنگ پکیج
        <span className="color-row">
          <input
            type="color"
            name="color"
            defaultValue={pkg?.color ?? "#147d70"}
            className="color-input"
          />
          {SWATCHES.map((c) => (
            <span
              key={c}
              className="swatch"
              style={{ background: c }}
              data-swatch={c}
            />
          ))}
        </span>
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="active"
          defaultChecked={pkg?.active ?? true}
        />
        فعال
      </label>
      {state.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      {state.success && <p className="success-note">{state.success}</p>}
      <Button disabled={pending} type="submit">
        {pending && <Loader2 className="spin" size={15} />}
        ذخیره
      </Button>
    </form>
  );
}
