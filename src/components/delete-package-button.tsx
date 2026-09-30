"use client";
import { useActionState, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deletePackage } from "@/actions/billing";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/actions/manage";

const empty: ActionResult = {};

export function DeletePackageButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deletePackage, empty);
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`حذف ${name}`}
        title="حذف پکیج"
        className="danger-icon"
        onClick={() => setOpen(true)}
      >
        <Trash2 size={16} />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="حذف پکیج">
          <p className="muted">
            آیا از حذف پکیج «{name}» مطمئن هستید؟ اگر این پکیج در اشتراکی
            استفاده شده باشد، حذف انجام نمی‌شود و می‌توانید به‌جای حذف آن را
            غیرفعال کنید.
          </p>
          {state.error && (
            <p role="alert" className="field-error">
              {state.error}
            </p>
          )}
          <form action={action} className="form-footer">
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? (
                <Loader2 className="spin" size={16} />
              ) : (
                <Trash2 size={16} />
              )}
              حذف پکیج
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              انصراف
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
