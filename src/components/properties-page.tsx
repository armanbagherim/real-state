import { listProperties, type SearchParams } from "@/repositories/properties";
import { requireUser } from "@/lib/auth";
import { PageHeading, Pagination } from "./page-parts";
import { PropertyFilters } from "./property-filters";
import { PropertyTable } from "./property-table";
export async function PropertiesPage({
  searchParams,
  title = "همه فایل‌ها",
  preset = {},
}: {
  searchParams: Promise<SearchParams>;
  title?: string;
  preset?: SearchParams;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const result = await listProperties({ ...params, ...preset }, user);
  return (
    <>
      <PageHeading
        title={title}
        description="فرصت‌های دفترتان را در یک نگاه ببینید و مدیریت کنید."
        href="/properties/new"
        action="ثبت فایل جدید"
      />
      <PropertyFilters />
      <section className="panel">
        <PropertyTable items={result.items} />
        <Pagination {...result} params={params} />
      </section>
    </>
  );
}
