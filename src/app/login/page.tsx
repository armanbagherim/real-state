import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  House,
  ShieldCheck,
  Building2,
  KeyRound,
  CalendarCheck,
} from "lucide-react";
import { LoginForm } from "./form";
export default async function Login() {
  const user = await getUser();
  if (user?.status === "APPROVED") redirect("/dashboard");
  return (
    <main id="main" className="login-page">
      <section className="login-brand">
        <div className="login-logo">
          <House size={36} />
          <span>آشیان.</span>
        </div>
        <div>
          <span className="eyebrow">فضای کار حرفه‌ای مشاوران املاک</span>
          <h1>
            هر فایل، یک فرصت.
            <br />
            هر ارتباط، یک آغاز.
          </h1>
          <p>
            فایل‌ها، قراردادها و پیگیری‌های دفترتان را
            <br />
            در یک فضای ساده و منظم مدیریت کنید.
          </p>
          <div className="login-features">
            <span>
              <Building2 />
              مدیریت فایل‌ها
            </span>
            <span>
              <KeyRound />
              قراردادهای منظم
            </span>
            <span>
              <CalendarCheck />
              پیگیری به‌موقع
            </span>
          </div>
        </div>
        <small>آشیان؛ همراه روزهای کاری شما</small>
      </section>
      <section className="login-form-wrap">
        <div className="login-form-card">
          <div className="login-icon">
            <House size={28} />
          </div>
          <h2>به آشیان خوش آمدید</h2>
          <p className="muted">
            برای ورود به فضای کاری، اطلاعات حساب خود را وارد کنید.
          </p>
          <LoginForm />
          <div className="login-security">
            <ShieldCheck size={16} /> اطلاعات دفتر شما، در فضایی امن
          </div>
        </div>
      </section>
    </main>
  );
}
