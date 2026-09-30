import Link from "next/link";
import { TriangleAlert, CreditCard, LogOut, PhoneCall } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SubscriptionRequired({
  officeName,
  code,
}: {
  officeName: string;
  code: string;
}) {
  return (
    <main id="main" className="gate-page">
      <div className="gate-card">
        <span className="gate-icon">
          <TriangleAlert size={30} />
        </span>
        <h1>اشتراک فعال نیست</h1>
        <p className="muted">
          دفتر <strong>{officeName}</strong> اشتراک فعالی ندارد، بنابراین تا پیش
          از خرید، امکان مشاهده فایل‌ها و ثبت اطلاعات وجود ندارد.
        </p>
        <div className="gate-box">
          <strong>شماره کارت برای واریز وجه</strong>
          <b dir="ltr">6104337424895755</b>
          <small>
            پس از واریز، تصویر رسید را همراه با انتخاب پکیج ثبت کنید. پس از
            تأیید، دسترسی دفتر فعال می‌شود.
          </small>
        </div>
        <div className="gate-actions">
          <Button asChild>
            <Link href="/buy">
              <CreditCard size={17} />
              خرید اشتراک
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <PhoneCall size={17} />
              تماس با پشتیبانی
            </Link>
          </Button>
        </div>
        <p className="gate-ref">
          کد معرف شما: <b dir="ltr">{code}</b>
        </p>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut size={16} />
            خروج از حساب
          </Button>
        </form>
      </div>
    </main>
  );
}
