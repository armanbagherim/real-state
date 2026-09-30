"use client";
import { useActionState } from "react";
import { Check, Loader2, Receipt, X } from "lucide-react";
import { approveSubscription, rejectSubscription } from "@/actions/billing";
import { money, fa } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/actions/manage";

const empty: ActionResult = {};

export function ApprovalActions({
  id,
  amount,
  receiptPath,
  referredBy,
  referrerPercent,
}: {
  id: string;
  amount: number;
  receiptPath: string;
  referredBy: string | null;
  referrerPercent: number;
}) {
  const [approve, approveAction, approving] = useActionState(
    approveSubscription,
    empty,
  );
  const [reject, rejectAction, rejecting] = useActionState(
    rejectSubscription,
    empty,
  );
  return (
    <div className="approval-simple">
      {receiptPath ? (
        <a
          className="receipt-link"
          href={receiptPath}
          target="_blank"
          rel="noreferrer"
        >
          <Receipt size={16} />
          مشاهده تصویر رسید
        </a>
      ) : (
        <span className="receipt-link muted">
          <Receipt size={16} />
          رسیدی پیوست نشده است
        </span>
      )}
      <p className="approval-amount">
        مبلغ فروش: <b>{money(String(amount))}</b>
      </p>
      {referredBy ? (
        <p className="approval-ref">
          کد معرف: <b dir="ltr">{referredBy}</b>
          {referrerPercent > 0 ? (
            <>
              {" · "}کمیسیون معرف: <b>{fa(referrerPercent)}٪</b> ={" "}
              <b>
                {money(String(Math.floor((amount * referrerPercent) / 100)))}
              </b>
            </>
          ) : (
            " · درصد کمیسیون این کاربر صفر است"
          )}
        </p>
      ) : (
        <p className="approval-ref muted">بدون کد معرف</p>
      )}
      {approve.error && (
        <p role="alert" className="field-error">
          {approve.error}
        </p>
      )}
      {reject.error && (
        <p role="alert" className="field-error">
          {reject.error}
        </p>
      )}
      <div className="approval-buttons">
        <form action={approveAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" disabled={approving}>
            {approving ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Check size={17} />
            )}
            تأیید و فعال‌سازی
          </Button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="destructive" disabled={rejecting}>
            {rejecting ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <X size={17} />
            )}
            رد درخواست
          </Button>
        </form>
      </div>
    </div>
  );
}
