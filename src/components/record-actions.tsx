"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateRecord } from "@/actions/manage";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
export function RecordAction({
  kind,
  id,
  action,
  children,
  confirm = false,
  variant = "outline",
}: {
  kind: string;
  id: string;
  action: string;
  children: React.ReactNode;
  confirm?: boolean;
  variant?: "outline" | "ghost" | "default" | "destructive";
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function run() {
    start(async () => {
      const result = await updateRecord(kind, id, action);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success);
        setOpen(false);
        if (kind === "property" && action === "delete")
          router.push("/properties");
        router.refresh();
      }
    });
  }
  return (
    <>
      <Button
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() => (confirm ? setOpen(true) : run())}
      >
        {pending ? <Loader2 size={15} className="spin" /> : children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="تأیید تغییر">
          <p className="muted">
            آیا از انجام «{children}» اطمینان دارید؟ این تغییر در اطلاعات دفتر
            ثبت می‌شود.
          </p>
          <div className="form-footer">
            <Button onClick={run} disabled={pending}>
              تأیید
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              انصراف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
