import { PageHeading, Badge } from "@/components/page-parts";
import { getAdminSubscriptionsData } from "@/repositories/billing-data";
import { ApprovalActions } from "@/components/billing-forms-admin";
import { money, dateFa, fa } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function AdminSubscriptionsPage() {
  const data = await getAdminSubscriptionsData();
  if (!data) notFound();
  const { pending, history } = data;
  return (
    <>
      <PageHeading
        title="بررسی درخواست‌های اشتراک"
        description={`${fa(pending.length)} درخواست در انتظار بررسی`}
      />
      <div className="panel detail-panel">
        <h2>در انتظار بررسی</h2>
        {pending.length ? (
          pending.map((s) => (
            <article className="pending-card" key={s.id}>
              <header className="row-between">
                <div>
                  <strong>{s.office.name}</strong>
                  <small>
                    {s.package.name} · {money(String(s.amount))} ·{" "}
                    {dateFa(s.createdAt)}
                  </small>
                </div>
                <Badge value={s.status} />
              </header>
              {s.buyerNote && <p className="muted">{s.buyerNote}</p>}
              <ApprovalActions
                id={s.id}
                amount={s.amount}
                receiptPath={s.receiptPath}
                referredBy={s.referredBy ? `${s.referredBy.name}` : null}
                referrerPercent={s.referredBy?.commissionPercent ?? 0}
              />
            </article>
          ))
        ) : (
          <p className="muted">درخواستی در انتظار نیست.</p>
        )}
      </div>

      <div className="panel detail-panel">
        <h2>تاریخچه</h2>
        {history.length ? (
          <div className="mini-list">
            {history.map((s) => (
              <div className="mini-record" key={s.id}>
                <strong>{s.office.name}</strong>
                <small>
                  {s.package.name} · {money(String(s.amount))} ·{" "}
                  {dateFa(s.createdAt)}
                  {s.approvedBy ? ` · تأیید: ${s.approvedBy.name}` : ""}
                </small>
                <Badge value={s.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">تاریخچه‌ای وجود ندارد.</p>
        )}
      </div>
    </>
  );
}
