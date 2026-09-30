import Link from "next/link";
import { CreditCard } from "lucide-react";
import { getMySubscriptionData } from "@/repositories/billing-data";
import { QuotaBanner } from "@/components/quota-banner";
import { RequestStatus } from "@/components/billing-forms";
import { PageHeading } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { money, fa, dateFa } from "@/lib/utils";

export default async function SubscriptionsPage() {
  const { mine, quota, packages } = await getMySubscriptionData();
  const pending = mine.find((m) => m.status === "AWAITING_RECEIPT");
  const active = mine.find(
    (m) => m.status === "ACTIVE" && m.endsAt && m.endsAt > new Date(),
  );
  return (
    <>
      <PageHeading
        title="اشتراک دفتر"
        description={
          active
            ? `اشتراک فعلی شما: ${active.package.name}`
            : "وضعیت اشتراک دفتر شما"
        }
      >
        <Button asChild>
          <Link href="/buy">
            <CreditCard size={17} />
            خرید اشتراک جدید
          </Link>
        </Button>
      </PageHeading>

      <QuotaBanner quota={quota} />

      {active && (
        <div className="panel detail-panel">
          <h2>اشتراک فعال</h2>
          <div className="plan-detail">
            <span
              className="plan-detail-dot"
              style={{ background: active.package.color }}
            />
            <div>
              <strong>{active.package.name}</strong>
              <small>
                اعتبار تا {dateFa(active.endsAt!)} · سقف{" "}
                {fa(active.package.propertyLimit)} فایل
              </small>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <div className="info-box">
          درخواست شما برای پکیج «{pending.package.name}» ثبت شده و در انتظار
          بررسی است.
        </div>
      )}

      {!active && !pending && !quota.hasSubscriptionHistory && (
        <div className="info-box">
          شما هنوز اشتراکی ندارید. برای شروع، یکی از پکیج‌های زیر را انتخاب
          کنید.
        </div>
      )}

      {!active && !pending && (
        <div className="panel detail-panel">
          <h2>پکیج‌های موجود</h2>
          <div className="package-grid">
            {packages.map((p) => (
              <article className="package-card" key={p.id}>
                <h3>
                  <span
                    className="package-dot"
                    style={{ background: p.color }}
                  />
                  {p.name}
                </h3>
                {p.description && <p className="muted">{p.description}</p>}
                <div className="package-prices">
                  <div>
                    <b>{money(String(p.monthlyPrice))}</b>
                    <span>ماهانه</span>
                  </div>
                  <div>
                    <b>{money(String(p.yearlyPrice))}</b>
                    <span>سالانه</span>
                  </div>
                </div>
                <ul className="package-specs">
                  <li>تا {fa(p.propertyLimit)} فایل</li>
                  <li>تا {fa(p.agentLimit)} مشاور</li>
                </ul>
                <Button asChild variant="outline" size="sm">
                  <Link href="/buy">
                    <CreditCard size={15} />
                    خرید این پکیج
                  </Link>
                </Button>
              </article>
            ))}
            {!packages.length && (
              <p className="muted">در حال حاضر پکیجی برای فروش موجود نیست.</p>
            )}
          </div>
        </div>
      )}

      <div className="panel detail-panel">
        <h2>سوابق درخواست‌ها</h2>
        <RequestStatus items={mine} />
      </div>
    </>
  );
}
