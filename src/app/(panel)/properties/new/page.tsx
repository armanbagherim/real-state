import { getNewPropertyData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { PropertyForm } from "@/components/property-form";

export default async function Page() {
  const { owners, settings } = await getNewPropertyData();
  return (
    <>
      <PageHeading
        title="ثبت فایل جدید"
        description="جزئیات ملک را وارد کنید؛ کد فایل به‌صورت خودکار ساخته می‌شود."
      />
      <section className="panel form-panel">
        <PropertyForm owners={owners} rate={Number(settings.conversionRate)} />
      </section>
    </>
  );
}
