import { getOwnerDetailData } from "@/repositories/office";
import { PageHeading, Pagination } from "@/components/page-parts";
import { PropertyTable } from "@/components/property-table";
import { OwnerForm } from "@/components/owner-form";
import { type SearchParams } from "@/repositories/properties";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id, query, owner, properties } = await getOwnerDetailData(
    params,
    searchParams,
  );
  return (
    <>
      <PageHeading
        title={owner.fullName}
        description="پرونده مالک و تمام فایل‌های مرتبط"
      />
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>فایل‌های این مالک</h2>
          </div>
          <PropertyTable items={properties.items} compact />
          <Pagination {...properties} params={query} />
        </section>
        <section className="panel detail-panel">
          <h2>اطلاعات تماس و ویرایش</h2>
          <OwnerForm
            id={id}
            values={{
              fullName: owner.fullName,
              mobile: owner.mobile,
              secondMobile: owner.secondMobile ?? "",
              phone: owner.phone ?? "",
              description: owner.description ?? "",
            }}
          />
        </section>
      </div>
    </>
  );
}
