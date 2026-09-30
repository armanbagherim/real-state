import { getContractsData, getNewContractData } from "@/repositories/office";
import Link from "next/link";
import { dateFa, shortMoney } from "@/lib/utils";
import { PageHeading, Badge, Empty, Pagination } from "@/components/page-parts";
import { str, type SearchParams } from "@/repositories/properties";
import { Button } from "@/components/ui/button";
import { NewRecordDialog } from "@/components/new-record-dialog";
import { contractFields } from "@/components/record-fields";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, page, status, items, total } = await getContractsData(
    searchParams,
  );
  const options = await getNewContractData(Promise.resolve(params));
  return (
    <>
      <PageHeading
        title="قراردادها"
        description="قراردادها، تاریخچه تمدید و سررسیدها را یکجا مدیریت کنید."
      >
        <NewRecordDialog
          kind="contract"
          title="ثبت قرارداد اجاره"
          triggerLabel="ثبت قرارداد"
          wide
          fields={contractFields(options.properties)}
          values={{ propertyId: str(params, "propertyId") }}
        />
      </PageHeading>
      <form className="filter-panel filter-top">
        <select aria-label="وضعیت قرارداد" name="status" defaultValue={status}>
          <option value="">همه قراردادها</option>
          <option value="ACTIVE">فعال</option>
          <option value="EXPIRED">پایان‌یافته</option>
          <option value="RENEWED">تمدید‌شده</option>
          <option value="CANCELLED">لغوشده</option>
        </select>
        <label className="filter-check">
          <input
            type="checkbox"
            name="expiring"
            value="60"
            defaultChecked={!!str(params, "expiring")}
          />
          پایان در ۶۰ روز آینده
        </label>
        <Button variant="outline">اعمال فیلتر</Button>
      </form>
      <section className="panel">
        {items.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ملک</th>
                  <th>مالک / مستأجر</th>
                  <th>شروع</th>
                  <th>پایان</th>
                  <th>رهن / اجاره</th>
                  <th>وضعیت</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/contracts/${c.id}`}>
                        <strong>{c.property.title}</strong>
                        <small className="block" dir="ltr">
                          {c.property.fileCode}
                        </small>
                      </Link>
                    </td>
                    <td>
                      <div className="cell-stack">
                        {c.owner.fullName}
                        <small>{c.tenantName}</small>
                      </div>
                    </td>
                    <td>{dateFa(c.startDate)}</td>
                    <td>{dateFa(c.endDate)}</td>
                    <td>
                      <div className="cell-stack">
                        {shortMoney(String(c.mortgageAmount))}
                        <small>{shortMoney(String(c.rentAmount))} تومان</small>
                      </div>
                    </td>
                    <td>
                      <Badge
                        value={
                          c.status === "ACTIVE" && c.endDate < new Date()
                            ? "EXPIRED"
                            : c.status
                        }
                      />
                    </td>
                    <td>
                      <Link className="text-link" href={`/contracts/${c.id}`}>
                        جزئیات ←
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty href="/contracts/new" action="ثبت قرارداد" />
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
