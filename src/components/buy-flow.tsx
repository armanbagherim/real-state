"use client";
import { useActionState, useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  History,
  Loader2,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { requestSubscription } from "@/actions/billing";
import { CARD_NUMBER } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { discountPercent, periods, priceFor, type Period } from "@/lib/billing";
import { fa, money } from "@/lib/utils";
import type { ActionResult } from "@/actions/manage";

const empty: ActionResult = {};

export const CARD_HOLDER = "آرمان باقری";
export const CARD_BANK = "بانک ملت";

type Package = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  propertyLimit: number;
  agentLimit: number;
  color: string;
  badge: string;
};

export function BuyFlow({
  packages,
  children,
}: {
  packages: Package[];
  children: React.ReactNode;
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Package | null>(null);
  const [period, setPeriod] = useState<Period>("YEARLY");
  const [done, setDone] = useState(false);
  const [state, action, pending] = useActionState(requestSubscription, empty);

  if (done || (state.success && picked))
    return (
      <div className="buy-success">
        <span className="buy-success-icon">
          <Check size={34} />
        </span>
        <h2>خرید شما ثبت شد</h2>
        <p>
          رسید شما دریافت شد و به‌زودی بررسی می‌شود. پس از تأیید، اشتراک دفتر
          شما به‌صورت خودکار فعال می‌شود و دسترسی کامل باز می‌گردد.
        </p>
        <small>اگر بیش از ۲۴ ساعت خبری نشد، با پشتیبانی تماس بگیرید.</small>
        <Button variant="outline" onClick={() => setDone(false)}>
          <History size={16} />
          مشاهده سوابق
        </Button>
      </div>
    );

  return (
    <div className="buy-flow">
      <ol className="buy-steps">
        {["انتخاب پکیج", "اطلاعات کارت", "ثبت رسید"].map((label, i) => (
          <li
            key={label}
            className={i === step ? "active" : i < step ? "done" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="buy-step">
          <div className="period-tabs" role="tablist" aria-label="دوره اشتراک">
            {periods.map((p) => (
              <button
                key={p.value}
                type="button"
                role="tab"
                aria-selected={period === p.value}
                className={`period-tab${period === p.value ? " on" : ""}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <h2>پکیج مورد نظر را انتخاب کنید</h2>
          <div className="package-grid">
            {packages.map((p) => {
              const off = discountPercent(p.monthlyPrice, p.yearlyPrice);
              return (
                <article
                  key={p.id}
                  className={`package-card pick${
                    picked?.id === p.id ? " on" : ""
                  }`}
                >
                  <h3>
                    <span
                      className="package-dot"
                      style={{ background: p.color }}
                    />
                    {p.name}
                  </h3>
                  {p.badge && <span className="package-badge">{p.badge}</span>}
                  {p.description && <p className="muted">{p.description}</p>}
                  <div className="package-prices">
                    <div className={period === "MONTHLY" ? "on" : ""}>
                      <b>{money(String(p.monthlyPrice))}</b>
                      <span>ماهانه</span>
                    </div>
                    <div className={period === "YEARLY" ? "on" : ""}>
                      <b>{money(String(p.yearlyPrice))}</b>
                      <span>سالانه</span>
                      {period === "YEARLY" && off > 0 && (
                        <em className="package-off">{fa(off)}٪ تخفیف</em>
                      )}
                    </div>
                  </div>
                  <ul className="package-specs">
                    <li>تا {fa(p.propertyLimit)} فایل</li>
                    <li>تا {fa(p.agentLimit)} مشاور</li>
                  </ul>
                  <Button
                    type="button"
                    variant={picked?.id === p.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPicked(p)}
                  >
                    {picked?.id === p.id ? (
                      <>
                        <Check size={15} /> انتخاب شد
                      </>
                    ) : (
                      <>
                        <CreditCard size={15} /> انتخاب
                      </>
                    )}
                  </Button>
                </article>
              );
            })}
            {!packages.length && (
              <p className="muted">در حال حاضر پکیجی برای فروش موجود نیست.</p>
            )}
          </div>
          <div className="buy-step-actions">
            <Button disabled={!picked} onClick={() => setStep(1)}>
              ادامه
            </Button>
            <Button type="button" variant="ghost">
              <History size={16} />
              تاریخچه پرداخت‌ها
            </Button>
          </div>
        </div>
      )}

      {step === 1 && picked && (
        <div className="buy-step">
          <h2>مبلغ را به کارت زیر واریز کنید</h2>
          <div className="bank-card">
            <div className="bank-card-top">
              <span>{CARD_BANK}</span>
              <CreditCard size={22} />
            </div>
            <b className="bank-card-number" dir="ltr">
              {CARD_NUMBER}
            </b>
            <div className="bank-card-bottom">
              <span>
                به نام <strong>{CARD_HOLDER}</strong>
              </span>
              <span dir="ltr">6104 •••• •••• 5755</span>
            </div>
          </div>
          <div className="buy-total">
            <span>
              پکیج <strong>{picked.name}</strong> ·{" "}
              {period === "YEARLY" ? "سالانه" : "ماهانه"}
            </span>
            <strong>{money(String(priceFor(picked, period)))}</strong>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(CARD_NUMBER);
                toast.success("شماره کارت کپی شد");
              } catch {
                toast.error("کپی نشد");
              }
            }}
          >
            <Copy size={16} />
            کپی شماره کارت
          </Button>
          <div className="buy-step-actions">
            <Button variant="ghost" onClick={() => setStep(0)}>
              مرحله قبل
            </Button>
            <Button onClick={() => setStep(2)}>
              <Receipt size={16} />
              رسید را ارسال کردم
            </Button>
          </div>
        </div>
      )}

      {step === 2 && picked && (
        <form action={action} className="buy-step">
          <input type="hidden" name="packageId" value={picked.id} />
          <input type="hidden" name="period" value={period} />
          <h2>تصویر رسید را بارگذاری کنید</h2>
          <label className="buy-drop">
            <Receipt size={26} />
            <span>انتخاب تصویر رسید</span>
            <small>JPG، PNG یا WebP تا ۸ مگابایت</small>
            <input
              type="file"
              name="receipt"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </label>
          <label className="buy-note">
            توضیح (اختیاری)
            <textarea name="buyerNote" rows={2} />
          </label>
          {state.error && (
            <p role="alert" className="field-error">
              {state.error}
            </p>
          )}
          <div className="buy-step-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={pending}
            >
              مرحله قبل
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="spin" size={17} />
              ) : (
                <ShieldCheck size={17} />
              )}
              ثبت نهایی درخواست
            </Button>
          </div>
        </form>
      )}

      <div className="buy-history">{children}</div>
    </div>
  );
}
