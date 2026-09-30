import { getNewContractData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm } from "@/components/forms";
import { contractFields } from "@/components/record-fields";
import { str, type SearchParams } from "@/repositories/properties";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, previous, properties } = await getNewContractData(
    searchParams,
  );
  const fields = contractFields(properties);
  return (
    <>
      <PageHeading
        title={previous ? "تمدید قرارداد" : "ثبت قرارداد اجاره"}
        description="یادآوری‌های پایان قرارداد پس از ثبت، خودکار ایجاد می‌شوند."
      />
      {previous && (
        <div className="info-box">
          قرارداد قبلی حفظ می‌شود و این قرارداد در ادامه سابقه آن ثبت خواهد شد.
        </div>
      )}
      <section className="panel form-panel">
        <RecordForm
          kind="contract"
          fields={fields}
          hidden={{ previousContractId: previous?.id ?? "" }}
          values={{
            propertyId: previous?.propertyId ?? str(params, "propertyId"),
            tenantName: previous?.tenantName ?? "",
            tenantMobile: previous?.tenantMobile ?? "",
            startDate:
              previous?.endDate.toISOString() ?? new Date().toISOString(),
            endDate: new Date(
              (previous?.endDate.getTime() ?? new Date().getTime()) +
                365 * 86400000,
            ).toISOString(),
            mortgageAmount: String(previous?.mortgageAmount ?? 0),
            rentAmount: String(previous?.rentAmount ?? 0),
          }}
        />
      </section>
    </>
  );
}
