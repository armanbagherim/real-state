import { getOwnersData } from "@/repositories/office";
import Link from "next/link";
import { Phone, ArrowUpLeft, Search } from "lucide-react";
import { fa } from "@/lib/utils";
import { PageHeading, Empty, Pagination } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { type SearchParams } from "@/repositories/properties";
import { FormDialog } from "@/components/form-dialog";
import { OwnerForm } from "@/components/owner-form";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, q, page, owners, total } = await getOwnersData(searchParams);
  return (
    <>
      <PageHeading
        title="مالکین"
        description="ارتباط‌های ارزشمند دفترتان را همیشه در دسترس داشته باشید."
      >
        <FormDialog title="ثبت مالک جدید" triggerLabel="ثبت مالک جدید">
          <OwnerForm />
        </FormDialog>
      </PageHeading>
      <form className="filter-panel filter-top">
        <div className="filter-search">
          <Search size={18} />
          <input
            name="q"
            aria-label="جستجوی مالک"
            placeholder="نام مالک، شماره تماس یا کد فایل"
            defaultValue={q}
          />
        </div>
        <Button variant="outline">جستجو</Button>
      </form>
      {owners.length ? (
        <div className="owners-grid">
          {owners.map((o) => (
            <section className="panel owner-card" key={o.id}>
              <div className="row-between">
                <span className="avatar large-avatar">{o.fullName[0]}</span>
                <Link
                  href={`/owners/${o.id}`}
                  aria-label={`پرونده ${o.fullName}`}
                >
                  <ArrowUpLeft size={21} />
                </Link>
              </div>
              <h2>
                <Link href={`/owners/${o.id}`}>{o.fullName}</Link>
              </h2>
              <a href={`tel:${o.mobile}`} className="row-gap muted">
                <Phone size={15} />
                <span dir="ltr">{o.mobile}</span>
              </a>
              <div className="owner-card-bottom">
                <span>{fa(o._count.properties)} فایل ملک</span>
                <Link href={`/owners/${o.id}`}>مشاهده پرونده ←</Link>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Empty href="/owners/new" action="ثبت مالک" />
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
