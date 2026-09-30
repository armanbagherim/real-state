import { getFollowUpsData, getNewFollowUpData } from "@/repositories/office";
import Link from "next/link";
import { Phone } from "lucide-react";
import { dateFa } from "@/lib/utils";
import { PageHeading, Badge, Empty, Pagination } from "@/components/page-parts";
import { RecordAction } from "@/components/record-actions";
import { str, type SearchParams } from "@/repositories/properties";
import { Button } from "@/components/ui/button";
import { NewRecordDialog } from "@/components/new-record-dialog";
import { followUpFields } from "@/components/record-fields";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, page, status, items, total } = await getFollowUpsData(
    searchParams,
  );
  const options = await getNewFollowUpData(Promise.resolve(params));
  return (
    <>
      <PageHeading
        title="پیگیری‌ها"
        description="هیچ تماس و فرصتی را از دست ندهید."
      >
        <NewRecordDialog
          kind="follow-up"
          title="ثبت پیگیری"
          triggerLabel="ثبت پیگیری"
          fields={followUpFields(options.properties, options.owners)}
          values={{ propertyId: str(params, "propertyId") }}
        />
      </PageHeading>
      <form className="filter-panel filter-top">
        <select name="status" defaultValue={status} aria-label="وضعیت پیگیری">
          <option value="PENDING">در انتظار</option>
          <option value="COMPLETED">انجام‌شده</option>
          <option value="CANCELLED">لغوشده</option>
          <option value="ALL">همه</option>
        </select>
        <label className="filter-check">
          <input
            type="checkbox"
            name="today"
            value="true"
            defaultChecked={!!str(params, "today")}
          />
          فقط امروز
        </label>
        <Button variant="outline">اعمال فیلتر</Button>
      </form>
      <section className="panel">
        {items.length ? (
          items.map((f) => (
            <div className="follow-up-row" key={f.id}>
              <span className="stat-icon teal">
                <Phone size={21} />
              </span>
              <div className="follow-up-copy">
                <h3>{f.note}</h3>
                <p>
                  {f.owner?.fullName ?? "پیگیری دفتر"} ·{" "}
                  {dateFa(f.followUpDate)} · {f.user.name}
                </p>
                {f.property && (
                  <Link
                    className="text-link"
                    href={`/properties/${f.propertyId}`}
                  >
                    {f.property.fileCode} · {f.property.title}
                  </Link>
                )}
              </div>
              <Badge value={f.status} />
              <div className="action-wrap">
                {f.owner && (
                  <a
                    className="btn btn-outline btn-sm"
                    href={`tel:${f.owner.mobile}`}
                  >
                    تماس
                  </a>
                )}
                {f.status === "PENDING" ? (
                  <>
                    <RecordAction kind="follow-up" id={f.id} action="COMPLETED">
                      انجام شد
                    </RecordAction>
                    <RecordAction
                      kind="follow-up"
                      id={f.id}
                      action="CANCELLED"
                      confirm
                    >
                      لغو
                    </RecordAction>
                  </>
                ) : (
                  <RecordAction kind="follow-up" id={f.id} action="PENDING">
                    بازگشایی
                  </RecordAction>
                )}
              </div>
            </div>
          ))
        ) : (
          <Empty href="/follow-ups/new" action="ثبت پیگیری" />
        )}
        <Pagination
          page={page}
          pages={Math.ceil(total / 15)}
          total={total}
          params={params}
        />
      </section>
    </>
  );
}
