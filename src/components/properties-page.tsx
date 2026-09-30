import { listProperties, type SearchParams } from "@/repositories/properties";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeading, Pagination } from "./page-parts";
import { PropertyFilters } from "./property-filters";
import { PropertyTable } from "./property-table";
import { NewPropertyDialog } from "./new-property-dialog";
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
  const owners = await db.owner.findMany({
    where: { officeId: user.officeId ?? "__none__" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });
  const settings = await db.settings.findFirst({
    where: { officeId: user.officeId ?? "__none__" },
    select: { conversionRate: true },
  });
  const isSuper = user.role === "SUPER_ADMIN";
  const packages = isSuper
    ? await db.package.findMany({
        select: { id: true, name: true, monthlyPrice: true, yearlyPrice: true },
        orderBy: { monthlyPrice: "asc" },
      })
    : [];
  const offices = isSuper
    ? await db.office.findMany({ select: { id: true, name: true } })
    : [];
  return (
    <>
      <PageHeading
        title={title}
        description="فرصت‌های دفترتان را در یک نگاه ببینید و مدیریت کنید."
      >
        <NewPropertyDialog
          owners={owners}
          rate={Number(settings?.conversionRate ?? 0)}
        />
      </PageHeading>
      <PropertyFilters />
      <section className="panel">
        <PropertyTable
          items={result.items}
          owners={owners}
          rate={Number(settings?.conversionRate ?? 0)}
          assignable={isSuper}
          packages={packages}
          offices={offices}
        />
        <Pagination {...result} params={params} />
      </section>
    </>
  );
}
