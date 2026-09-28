import { getContractDetailData } from "@/repositories/office";
import Link from "next/link";
import { dateFa, money, fa } from "@/lib/utils";
import { PageHeading, Badge } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { RecordAction } from "@/components/record-actions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id, c } = await getContractDetailData(params);
  return (
    <>
      <PageHeading
        title={`قرارداد ${c.property.fileCode}`}
        description={c.property.title}
      >
        {["ACTIVE", "EXPIRED"].includes(c.status) && (
          <Button asChild>
            <Link href={`/contracts/new?previousContractId=${id}`}>
              تمدید قرارداد
            </Link>
          </Button>
        )}
      </PageHeading>
      <div className="detail-grid">
        <section className="panel detail-panel">
          <div className="row-between">
            <h2>مشخصات قرارداد</h2>
            <Badge
              value={
                c.status === "ACTIVE" && c.endDate < new Date()
                  ? "EXPIRED"
                  : c.status
              }
            />
          </div>
          <dl className="detail-list">
            {[
              ["شروع قرارداد", dateFa(c.startDate)],
              ["پایان قرارداد", dateFa(c.endDate)],
              ["مالک", c.owner.fullName],
              ["تماس مالک", c.owner.mobile],
              ["مستأجر", c.tenantName],
              ["تماس مستأجر", c.tenantMobile],
              ["رهن", money(String(c.mortgageAmount))],
              ["اجاره ماهانه", money(String(c.rentAmount))],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="preserve-space">{c.description}</p>
          <Link href={`/properties/${c.propertyId}`} className="text-link">
            مشاهده پرونده ملک ←
          </Link>
          <div className="form-footer">
            {c.previousContract && (
              <Button asChild variant="outline">
                <Link href={`/contracts/${c.previousContract.id}`}>
                  قرارداد قبلی
                </Link>
              </Button>
            )}
            {c.nextContract && (
              <Button asChild variant="outline">
                <Link href={`/contracts/${c.nextContract.id}`}>
                  قرارداد تمدیدشده
                </Link>
              </Button>
            )}
            {c.status === "ACTIVE" && (
              <>
                <RecordAction kind="contract" id={id} action="EXPIRED" confirm>
                  پایان قرارداد
                </RecordAction>
                <RecordAction
                  kind="contract"
                  id={id}
                  action="CANCELLED"
                  confirm
                  variant="destructive"
                >
                  لغو قرارداد
                </RecordAction>
              </>
            )}
          </div>
        </section>
        <section className="panel detail-panel">
          <h2>یادآوری‌های خودکار ({fa(c.reminders.length)})</h2>
          {c.reminders.map((r) => (
            <div className="mini-record" key={r.id}>
              <strong>{r.title}</strong>
              <small>{dateFa(r.remindAt)}</small>
              <Badge value={r.status} />
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
