import { getNewFollowUpData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { str, type SearchParams } from "@/repositories/properties";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { params, properties, owners } = await getNewFollowUpData(searchParams);
  const fields: Field[] = [
    {
      name: "propertyId",
      label: "ملک مرتبط (اختیاری)",
      type: "select",
      options: [
        { value: "", label: "بدون ملک" },
        ...properties.map((p) => ({
          value: p.id,
          label: `${p.fileCode} · ${p.title}`,
        })),
      ],
    },
    {
      name: "ownerId",
      label: "مالک (در صورت انتخاب ملک، خودکار تعیین می‌شود)",
      type: "select",
      options: [
        { value: "", label: "بدون مالک" },
        ...owners.map((o) => ({ value: o.id, label: o.fullName })),
      ],
    },
    {
      name: "type",
      label: "نوع پیگیری",
      type: "select",
      options: [
        ["CALL", "تماس"],
        ["FOLLOW_UP", "پیگیری فایل"],
        ["CONTRACT", "قرارداد"],
        ["OWNER", "مالک"],
        ["OTHER", "سایر"],
      ].map(([value, label]) => ({ value, label })),
    },
    {
      name: "followUpDate",
      label: "تاریخ پیگیری",
      type: "date",
      required: true,
    },
    {
      name: "note",
      label: "شرح پیگیری",
      type: "textarea",
      required: true,
      wide: true,
    },
  ];
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
