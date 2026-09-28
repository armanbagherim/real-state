import { getPropertyEditData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { PropertyForm } from "@/components/property-form";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id, property, owners, settings } = await getPropertyEditData(params);
  const values: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(property))
    if (value !== null)
      values[key] =
        typeof value === "boolean" || typeof value === "number"
          ? value
          : String(value);
  return (
    <>
      <PageHeading
        title={`ویرایش فایل ${property.fileCode}`}
        description="اطلاعات ملک را به‌روز نگه دارید."
      />
      <section className="panel form-panel">
        <PropertyForm
          id={id}
          owners={owners}
          values={values}
          rate={Number(settings.conversionRate)}
        />
      </section>
    </>
  );
}
