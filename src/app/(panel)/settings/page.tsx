import { getSettingsData } from "@/repositories/office";
import { Settings, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
export default async function Page() {
  const { user, settings } = await getSettingsData();
  const fields: Field[] = [
    { name: "officeName", label: "نام دفتر", required: true },
    { name: "officePhone", label: "تلفن دفتر", type: "tel" },
    { name: "officeAddress", label: "آدرس دفتر", wide: true },
    {
      name: "conversionRate",
      label: "نرخ تبدیل رهن به اجاره",
      type: "number",
      hint: "مثال: ۰٫۰۳ یعنی هر ۱۰۰ میلیون تومان رهن معادل ۳ میلیون تومان اجاره است.",
      required: true,
    },
    {
      name: "reminderDays",
      label: "روزهای یادآوری قبل از پایان قرارداد",
      hint: "روزها را با ویرگول جدا کنید. تغییر برای قراردادهای جدید اعمال می‌شود.",
      required: true,
    },
    {
      name: "adminsCanViewAgentFiles",
      label: "مدیر دفتر فایل‌های مشاورین را ببیند",
      type: "checkbox",
      hint: "اگر خاموش باشد مدیر دفتر فقط فایل‌هایی را می‌بیند که خودش ثبت کرده یا با او اشتراک‌گذاری شده است.",
    },
  ];
  return (
    <>
      <PageHeading
        title="تنظیمات دفتر"
        description="آشیان را با روال کاری دفتر خود هماهنگ کنید."
      />
      <div className="settings-layout">
        <section className="panel form-panel">
          <div className="section-heading">
            <Settings size={21} />
            <h2>تنظیمات عمومی</h2>
          </div>
          {["SUPER_ADMIN", "OFFICE_ADMIN"].includes(user.role) ? (
            <RecordForm
              kind="settings"
              fields={fields}
              values={{
                officeName: settings.officeName,
                officePhone: settings.officePhone,
                officeAddress: settings.officeAddress,
                conversionRate: Number(settings.conversionRate),
                reminderDays: settings.reminderDays.join(", "),
                adminsCanViewAgentFiles:
                  user.office?.adminsCanViewAgentFiles ?? true,
              }}
            />
          ) : (
            <p>تغییر تنظیمات فقط برای مدیر دفتر مجاز است.</p>
          )}
        </section>
        <section className="panel detail-panel">
          <span className="stat-icon teal">
            <ShieldCheck size={24} />
          </span>
          <h2>فضای کاری شما</h2>
          <p className="muted">
            اطلاعات تنظیمات در دیتابیس دفتر نگهداری می‌شود و برای تمام مشاوران
            یکسان است.
          </p>
          <div className="info-box">
            مبالغ برنامه برحسب <b>تومان</b> هستند. تاریخ‌ها در رابط به‌صورت{" "}
            <b>شمسی</b> نمایش داده می‌شوند.
          </div>
          <p className="muted">
            برای نصب روی موبایل، از گزینه «افزودن به صفحه اصلی» در مرورگر
            استفاده کنید.
          </p>
        </section>
      </div>
    </>
  );
}
