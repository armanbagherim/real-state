import { getNewFollowUpData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm } from "@/components/forms";
import { followUpFields } from "@/components/record-fields";
import { str, type SearchParams } from "@/repositories/properties";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, properties, owners } = await getNewFollowUpData(searchParams);
  const fields = followUpFields(properties, owners);
  return (
    <>
      <PageHeading
        title="ثبت پیگیری"
        description="یک کار مشخص با زمان مشخص برای دفترتان ثبت کنید."
      />
      <section className="panel form-panel">
        <RecordForm
          kind="follow-up"
          fields={fields}
          values={{
            propertyId: str(params, "propertyId"),
            followUpDate: new Date().toISOString(),
          }}
        />
      </section>
    </>
  );
}
