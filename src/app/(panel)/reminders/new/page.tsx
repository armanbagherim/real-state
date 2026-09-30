import { getNewReminderData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm } from "@/components/forms";
import { reminderFields } from "@/components/record-fields";
export default async function Page() {
  const { properties, owners } = await getNewReminderData();
  const fields = reminderFields(properties, owners);
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
