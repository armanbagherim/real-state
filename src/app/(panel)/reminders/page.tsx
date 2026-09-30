import { getRemindersData, getNewReminderData } from "@/repositories/office";
import Link from "next/link";
import { Bell, Phone } from "lucide-react";
import { dateFa, fa } from "@/lib/utils";
import { PageHeading, Badge, Empty, Pagination } from "@/components/page-parts";
import { RecordAction } from "@/components/record-actions";
import { type SearchParams } from "@/repositories/properties";
import { Button } from "@/components/ui/button";
import { NewRecordDialog } from "@/components/new-record-dialog";
import { reminderFields } from "@/components/record-fields";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, page, status, items, total } = await getRemindersData(
    searchParams,
  );
  const options = await getNewReminderData();
  return (
    <>
      <PageHeading
        title="یادآوری‌ها"
        description="سررسیدهای مهم و قدم بعدی هر ارتباط را دنبال کنید."
      >
        <NewRecordDialog
          kind="reminder"
          title="یادآوری جدید"
          triggerLabel="یادآوری جدید"
          fields={reminderFields(options.properties, options.owners)}
        />
      </PageHeading>
      <form className="filter-panel filter-top">
        <select name="status" defaultValue={status} aria-label="وضعیت یادآوری">
          <option value="PENDING">در انتظار</option>
          <option value="COMPLETED">انجام‌شده</option>
          <option value="DISMISSED">بسته‌شده</option>
          <option value="ALL">همه</option>
        </select>
        <Button variant="outline">اعمال فیلتر</Button>
      </form>
      <div className="reminders-grid">
        {items.map((r) => (
          <section className="panel reminder-card" key={r.id}>
            <div className="row-between">
              <span className="stat-icon amber">
                <Bell size={21} />
              </span>
              <Badge value={r.status} />
            </div>
            <h2>{r.title}</h2>
            {r.leaseContract && (
              <p className="text-link">
                {r.leaseContract.endDate < new Date()
                  ? "تاریخ پایان قرارداد گذشته است"
                  : `پایان قرارداد تا ${fa(
                      Math.ceil(
                        (r.leaseContract.endDate.getTime() -
                          new Date().getTime()) /
                          86400000,
                      ),
                    )} روز دیگر`}
              </p>
            )}
            <p className="muted">
              {dateFa(r.remindAt)}
              {r.remindAt < new Date() && r.status === "PENDING"
                ? " · زمان پیگیری رسیده است"
                : ""}
            </p>
            {r.description && <p>{r.description}</p>}
            {r.property && (
              <Link className="text-link" href={`/properties/${r.propertyId}`}>
                {r.property.fileCode} · {r.property.title}
              </Link>
            )}
            {r.owner && (
              <div className="reminder-owner">
                <span>{r.owner.fullName}</span>
                <a href={`tel:${r.owner.mobile}`} dir="ltr">
                  <Phone size={14} />
                  {r.owner.mobile}
                </a>
              </div>
            )}
            {r.status === "PENDING" && (
              <div className="reminder-actions">
                {[
                  ["CALLED", "تماس گرفته شد"],
                  ["NO_ANSWER", "پاسخ نداد"],
                  ["CALL_BACK", "تماس مجدد"],
                  ["RENEW_INTENT", "قصد تمدید دارد"],
                  ["SALE_INTENT", "قصد فروش دارد"],
                  ["REFILE", "فایل مجدد"],
                  ["DISMISSED", "بستن یادآوری"],
                ]
                  .filter(([action]) => action !== "REFILE" || r.property)
                  .map(([action, label]) => (
                    <RecordAction
                      key={action}
                      kind="reminder"
                      id={r.id}
                      action={action}
                      confirm={action === "REFILE"}
                    >
                      {label}
                    </RecordAction>
                  ))}
                {r.leaseContract &&
                  ["ACTIVE", "EXPIRED"].includes(r.leaseContract.status) && (
                    <Button asChild size="sm">
                      <Link
                        href={`/contracts/new?previousContractId=${r.leaseContractId}`}
                      >
                        تمدید قرارداد
                      </Link>
                    </Button>
                  )}
              </div>
            )}
          </section>
        ))}
      </div>
      {!items.length && (
        <section className="panel">
          <Empty href="/reminders/new" action="ثبت یادآوری" />
        </section>
      )}
      <Pagination
        page={page}
        pages={Math.ceil(total / 12)}
        total={total}
        params={params}
      />
    </>
  );
}
