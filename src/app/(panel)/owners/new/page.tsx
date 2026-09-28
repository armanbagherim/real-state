import { PageHeading } from "@/components/page-parts";
import { OwnerForm } from "@/components/owner-form";
import { requireUser } from "@/lib/auth";
export default async function Page() {
  await requireUser();
  return (
    <>
      <PageHeading
        title="ثبت مالک جدید"
        description="اطلاعات تماس مالک را ثبت کنید تا به فایل‌های ملک متصل شود."
      />
      <section className="panel form-panel">
        <OwnerForm />
      </section>
    </>
  );
}
