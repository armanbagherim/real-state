import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, House, ShieldCheck, UserPlus } from "lucide-react";
import { RegisterForm } from "./form";

export default async function RegisterPage() {
  const user = await getUser();
  if (user?.status === "APPROVED") redirect("/dashboard");
  if (user) redirect("/buy");
  return (
    <main id="main" className="login-page">
      <section className="login-brand">
        <div className="login-logo">
          <House size={36} />
          <span>آشیان.</span>
        </div>
        <div>
          <span className="eyebrow">راه‌اندازی پنل اختصاصی املاک</span>
          <h1>
            دفتر خودتان را بسازید.
            <br />
            مشاورها بعداً اضافه می‌شوند.
          </h1>
          <p>
            ثبت‌نام با شماره موبایل انجام می‌شود و پس از تأیید مدیر کل، دسترسی
            پنل برای دفتر فعال خواهد شد.
          </p>
          <div className="login-features">
            <span>
              <Building2 />
              اطلاعات دفتر
            </span>
            <span>
              <UserPlus />
              تأیید دستی کاربران
            </span>
            <span>
              <ShieldCheck />
              رمز عبور قوی
            </span>
          </div>
        </div>
        <small>آشیان؛ فضای کاری قابل فروش برای دفاتر املاک</small>
      </section>
      <section className="login-form-wrap">
        <div className="login-form-card">
          <div className="login-icon">
            <UserPlus size={28} />
          </div>
          <h2>ثبت‌نام املاک</h2>
          <p className="muted">
            اطلاعات دفتر و مدیر را وارد کنید تا حساب برای تأیید مدیر کل ثبت شود.
          </p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
