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
type Row = Prisma.PropertyGetPayload<{
  include: { owner: true; images: true };
}>;
export function PropertyTable({
  items,
  compact = false,
}: {
  items: Row[];
  compact?: boolean;
}) {
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
