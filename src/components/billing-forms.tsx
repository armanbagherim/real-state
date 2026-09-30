"use client";
import { useActionState, useState } from "react";
import { Copy, Loader2, Receipt, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { requestSubscription } from "@/actions/billing";
import { recalculateCommissions } from "@/actions/commission";
import { CARD_NUMBER } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/page-parts";
import { money, dateFa } from "@/lib/utils";
import type { ActionResult } from "@/actions/manage";

const empty: ActionResult = {};

export function CardNumber() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="card-number-box">
      <div>
        <strong>شماره کارت برای واریز وجه</strong>
        <b dir="ltr">{CARD_NUMBER}</b>
        <small>
          پس از واریز، تصویر رسید را در فرم بالا ثبت کنید تا پس از بررسی فعال
          شود.
        </small>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(CARD_NUMBER);
            setCopied(true);
            toast.success("شماره کارت کپی شد");
            setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error("کپی نشد");
          }
        }}
      >
        <Copy size={15} />
        {copied ? "کپی شد" : "کپی"}
      </Button>
    </div>
  );
}

export function SubscriptionRequestForm({ packageId }: { packageId: string }) {
  const [state, action, pending] = useActionState(requestSubscription, empty);
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Receipt size={15} />
        ثبت درخواست
      </Button>
    );
  return (
    <form action={action} className="request-form">
      <input type="hidden" name="packageId" value={packageId} />
      <label>
        توضیح
        <textarea name="buyerNote" rows={2} />
      </label>
      {state.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      {state.success && <p className="success-note">{state.success}</p>}
      <Button disabled={pending} type="submit">
        {pending && <Loader2 className="spin" size={16} />}
        ارسال درخواست
      </Button>{" "}
    </form>
  );
}

export function ReferralCodeView({ code }: { code: string }) {
  return (
    <div className="card-number-box">
      <div>
        <strong>کد معرف شما</strong>
        <b dir="ltr">{code}</b>
        <small>
          این کد برای همیشه متعلق به شماست. آن را به همکاران یا مشتریانتان
          بدهید؛ درصد کمیسیون فروش اول آن‌ها به شما تعلق می‌گیرد.
        </small>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            toast.success("کد معرف کپی شد");
          } catch {
            toast.error("کپی نشد");
          }
        }}
      >
        <Copy size={15} />
        کپی کد
      </Button>
    </div>
  );
}

export function RecalculateButton() {
  const [state, action, pending] = useActionState(
    recalculateCommissions,
    empty,
  );
  return (
    <form action={action} className="inline-form">
      <Button type="submit" disabled={pending}>
        <RefreshCw className={pending ? "spin" : ""} size={16} />
        {pending ? "در حال بازمحاسبه…" : "به‌روزرسانی درآمد"}
      </Button>
      {state.error && <small className="field-error">{state.error}</small>}
      {state.success && <small className="success-note">{state.success}</small>}
    </form>
  );
}

export function RequestStatus({
  items,
}: {
  items: {
    id: string;
    status: string;
    amount: number;
    createdAt: Date;
    endsAt: Date | null;
    package: { name: string };
  }[];
}) {
  if (!items.length) return <p className="muted">درخواستی ثبت نشده است.</p>;
  return (
    <div className="mini-list">
      {items.map((s) => (
        <div className="mini-record" key={s.id}>
          <strong>{s.package.name}</strong>
          <small>
            {money(String(s.amount))} · {dateFa(s.createdAt)}
            {s.endsAt ? ` · تا ${dateFa(s.endsAt)}` : ""}
          </small>
          <Badge value={s.status} />
        </div>
      ))}
    </div>
  );
}
