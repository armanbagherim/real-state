import { listProperties, type SearchParams } from "@/repositories/properties";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeading, Pagination } from "./page-parts";
import { PropertyFilters } from "./property-filters";
import { PropertyTable } from "./property-table";
import { NewPropertyDialog } from "./new-property-dialog";
import { FolderBulkProvider } from "./folder-bulk-move";
import type { FolderOption } from "./folder-select";
import { listAllFolders } from "@/repositories/folders";
import { folderOptions as folderOptionsFrom } from "@/lib/folder-tree";

export async function PropertiesPage({
  searchParams,
  title = "همه فایل‌ها",
  description = "فرصت‌های دفترتان را در یک نگاه ببینید و مدیریت کنید.",
  preset = {},
  above,
  headingExtra,
  afterHeading,
  folderOptions: folderOptionProps = [],
  lockedFolderId,
}: {
  searchParams: Promise<SearchParams>;
  title?: string;
  description?: string;
  preset?: SearchParams;
  above?: React.ReactNode;
  headingExtra?: React.ReactNode;
  afterHeading?: React.ReactNode;
  folderOptions?: FolderOption[];
  lockedFolderId?: string;
}) {
  const user = await requireUser();
  const params = await searchParams;
  let folderOptions = folderOptionProps;
  if (folderOptions.length === 0) {
    const all = await listAllFolders(user);
    folderOptions = folderOptionsFrom(all);
  }
  const merged = { ...params, ...preset };
  const result = await listProperties(merged, user);
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

  const folderNames = new Map(folderOptions.map((f) => [f.id, f]));
  const rows = result.items.map((item) => ({
    ...item,
    folder: item.folderId ? folderNames.get(item.folderId) : undefined,
  }));

  return (
    <>
      {above}
      <PageHeading title={title} description={description}>
        {headingExtra}
        <NewPropertyDialog
          owners={owners}
          rate={Number(settings?.conversionRate ?? 0)}
        />
      </PageHeading>
      {afterHeading}
      <PropertyFilters lockedFolderId={lockedFolderId} />
      <section className="panel">
        <FolderBulkProvider
          folders={folderOptions}
          excludeFolderId={lockedFolderId}
        >
          <PropertyTable
            items={rows}
            owners={owners}
            rate={Number(settings?.conversionRate ?? 0)}
            assignable={isSuper}
            packages={packages}
            offices={offices}
            folders={folderOptions}
            selectable
          />
        </FolderBulkProvider>
        <Pagination {...result} params={merged} />
      </section>
    </>
  );
}
