import { getNewReminderData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
export default async function Page() {
  const { properties, owners } = await getNewReminderData();
  const fields: Field[] = [
    { name: "title", label: "عنوان یادآوری", required: true, wide: true },
    {
      name: "propertyId",
      label: "ملک مرتبط",
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
      label: "مالک مرتبط",
      type: "select",
      options: [
        { value: "", label: "بدون مالک" },
        ...owners.map((o) => ({ value: o.id, label: o.fullName })),
      ],
    },
    {
      name: "type",
      label: "نوع یادآوری",
      type: "select",
      options: [
        { value: "CUSTOM", label: "شخصی" },
        { value: "CALL", label: "تماس" },
        { value: "FOLLOW_UP", label: "پیگیری" },
      ],
    },
    { name: "remindAt", label: "تاریخ یادآوری", type: "date", required: true },
    { name: "description", label: "توضیحات", type: "textarea", wide: true },
  ];
  return (
    <>
      <PageHeading
        title="یادآوری جدید"
        description="موضوع و تاریخ را ثبت کنید تا پیگیری آن فراموش نشود."
      />
      <section className="panel form-panel">
        <RecordForm
          kind="reminder"
          fields={fields}
          values={{ remindAt: new Date().toISOString() }}
        />
      </section>
    </>
  );
}
