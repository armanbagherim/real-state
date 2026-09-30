import Link from "next/link";
import {
  Building2,
  ArrowUpLeft,
  MapPin,
  BedDouble,
  Maximize,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { fa, shortMoney, dateFa } from "@/lib/utils";
import { Badge, Empty } from "./page-parts";
import { PropertyRowEdit } from "./property-row-edit";
import {
  AccessToggle,
  AssignSubscriptionButton,
} from "./property-access-controls";
type Row = Prisma.PropertyGetPayload<{
  include: { owner: true; images: true };
}>;
export function PropertyTable({
  items,
  compact = false,
  owners,
  rate = 0,
  assignable = false,
  packages = [],
  offices = [],
}: {
  items: Row[];
  compact?: boolean;
  owners?: { id: string; fullName: string }[];
  rate?: number;
  assignable?: boolean;
  packages?: { id: string; name: string; monthlyPrice: number }[];
  offices?: { id: string; name: string }[];
}) {
  const officeNames = new Map(offices.map((o) => [o.id, o.name]));
  const values = (p: Row): Record<string, string | number | boolean> => {
    const out: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(p))
      if (value !== null)
        out[key] =
          typeof value === "boolean" || typeof value === "number"
            ? value
            : String(value);
    return out;
  };
  if (!items.length)
    return (
      <Empty
        title="فایلی پیدا نشد"
        description="فیلترها را تغییر دهید یا یک فایل جدید ثبت کنید."
        href="/properties/new"
        action="ثبت فایل جدید"
      />
    );
  return (
    <>
      <div className="table-scroll property-desktop">
        <table>
          <thead>
            <tr>
              <th>اطلاعات ملک</th>
              <th>نوع معامله</th>
              <th>متراژ / خواب</th>
              <th>
                قیمت <small>(تومان)</small>
              </th>
              {!compact && <th>مالک</th>}
              <th>وضعیت</th>
              <th>
                <span className="sr-only">ویرایش</span>
              </th>
              <th>
                <span className="sr-only">مشاهده</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    className="property-identity"
                    href={`/properties/${p.id}`}
                  >
                    <div
                      className={`property-thumb thumb-${p.transactionType.toLowerCase()}`}
                    >
                      {p.images[0] ? (
                        <img
                          src={p.images[0].url}
                          alt=""
                          width={52}
                          height={52}
                        />
                      ) : (
                        <Building2 size={26} />
                      )}
                    </div>
                    <div>
                      <strong>{p.title}</strong>
                      <span>
                        <MapPin size={12} />
                        {p.neighborhood}
                        <i>·</i>
                        <b dir="ltr">{p.fileCode}</b>
                      </span>
                    </div>
                  </Link>
                </td>
                <td>
                  <span
                    className={`transaction transaction-${p.transactionType.toLowerCase()}`}
                  >
                    {p.transactionType === "SALE" ? "فروش" : "رهن و اجاره"}
                  </span>
                </td>
                <td>
                  <div className="cell-stack">
                    {fa(String(p.area))} متر
                    <small>{fa(p.bedrooms)} خوابه</small>
                  </div>
                </td>
                <td>
                  <div className="cell-stack price-cell">
                    {shortMoney(
                      String(
                        p.transactionType === "SALE"
                          ? p.salePrice
                          : p.mortgagePrice,
                      ),
                    )}
                    {p.transactionType === "RENT" && (
                      <small>اجاره {shortMoney(String(p.rentPrice))}</small>
                    )}
                  </div>
                </td>
                {!compact && (
                  <td>
                    <Link href={`/owners/${p.owner.id}`}>
                      {p.owner.fullName}
                    </Link>
                  </td>
                )}
                <td>
                  <Badge value={p.status} />
                </td>
                <td>
                  <div className="row-actions">
                    {owners && (
                      <PropertyRowEdit
                        id={p.id}
                        owners={owners}
                        values={values(p)}
                        rate={rate}
                        fileCode={p.fileCode}
                      />
                    )}
                    <AccessToggle
                      id={p.id}
                      fileCode={p.fileCode}
                      blocked={Boolean(p.accessBlockedAt)}
                    />
                    {assignable && (
                      <AssignSubscriptionButton
                        officeId={p.officeId}
                        officeName={
                          (p.officeId && officeNames.get(p.officeId)) || "دفتر"
                        }
                        fileCode={p.fileCode}
                        packages={packages}
                      />
                    )}
                  </div>
                </td>
                <td>
                  <Link
                    className="table-arrow"
                    aria-label={`مشاهده ${p.fileCode}`}
                    href={`/properties/${p.id}`}
                  >
                    <ArrowUpLeft size={19} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="property-mobile">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="property-mobile-card"
          >
            <div className="row-between">
              <span dir="ltr" className="muted">
                {p.fileCode}
              </span>
              <Badge value={p.status} />
            </div>
            <h3>{p.title}</h3>
            <p>
              <MapPin size={14} />
              {p.neighborhood} <span>·</span>{" "}
              {p.transactionType === "SALE" ? "فروش" : "اجاره"}
            </p>
            <div className="mobile-specs">
              <span>
                <Maximize size={15} />
                {fa(String(p.area))} متر
              </span>
              <span>
                <BedDouble size={15} />
                {fa(p.bedrooms)} خواب
              </span>
            </div>
            <div className="row-between">
              <strong>
                {shortMoney(
                  String(
                    p.transactionType === "SALE"
                      ? p.salePrice
                      : p.mortgagePrice,
                  ),
                )}{" "}
                تومان
              </strong>
              <small>{dateFa(p.createdAt)}</small>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
