"use client";
import { useActionState, useState } from "react";
import { Ban, CreditCard, Loader2, RotateCcw } from "lucide-react";
import {
  togglePropertyAccess,
  assignSubscription,
} from "@/actions/property-access";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fa } from "@/lib/utils";
import type { ActionResult } from "@/actions/manage";

const empty: ActionResult = {};

export function AccessToggle({
  id,
  fileCode,
  blocked,
}: {
  id: string;
  fileCode: string;
  blocked: boolean;
}) {
  const [state, action, pending] = useActionState(togglePropertyAccess, empty);
  return (
    <div className="row-inline">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label={
            blocked
              ? `بازکردن دسترسی ${fileCode}`
              : `مسدودکردن دسترسی ${fileCode}`
          }
          title={blocked ? "باز کردن دسترسی" : "مسدود کردن دسترسی"}
          disabled={pending}
          className={blocked ? "is-blocked" : ""}
        >
          {pending ? (
            <Loader2 className="spin" size={16} />
          ) : blocked ? (
            <RotateCcw size={16} />
          ) : (
            <Ban size={16} />
          )}
        </Button>
      </form>
      {state.error && <small className="field-error">{state.error}</small>}
    </div>
  );
}

export function AssignSubscriptionButton({
  officeId,
  officeName,
  fileCode,
  packages,
}: {
  officeId: string | null;
  officeName: string;
  fileCode: string;
  packages: { id: string; name: string; monthlyPrice: number }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(assignSubscription, empty);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`تخصیص اشتراک برای ${officeName}`}
        title="تخصیص دستی اشتراک"
        disabled={!officeId}
        onClick={() => setOpen(true)}
      >
        <CreditCard size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={`تخصیص اشتراک به ${officeName}`}>
          {!officeId ? (
            <p className="muted">این فایل به دفتری متصل نیست.</p>
          ) : (
            <form action={action} className="request-form">
              <input type="hidden" name="officeId" value={officeId} />
              <input type="hidden" name="fileCode" value={fileCode} />
              <label>
                دوره
                <select name="period" defaultValue="MONTHLY">
                  <option value="MONTHLY">ماهانه</option>
                  <option value="YEARLY">سالانه</option>
                </select>
              </label>
              <label>
                پکیج
                <select name="packageId" required defaultValue="">
                  <option value="">انتخاب پکیج…</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ماهانه {fa(p.monthlyPrice)} تومان
                    </option>
                  ))}
                </select>
              </label>
              {state.error && (
                <p role="alert" className="field-error">
                  {state.error}
                </p>
              )}
              {state.success && <p className="success-note">{state.success}</p>}
              <Button disabled={pending} type="submit">
                {pending && <Loader2 className="spin" size={16} />}
                تخصیص اشتراک
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
