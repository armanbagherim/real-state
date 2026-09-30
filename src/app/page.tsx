import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  Eye,
  FileStack,
  House,
  Images,
  KeyRound,
  PhoneCall,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { siteUrl } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { LandingPricing } from "@/components/landing-pricing";

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "آشیان | سامانه مدیریت املاک و فایل مشاوران",
  description:
    "آشیان، فضای کار حرفه‌ای مشاوران املاک: مدیریت فایل‌ها، پرونده مالکین، قراردادها، پیگیری‌ها و یادآوری‌ها در یک سامانه یکپارچه. ویژه دفاتر املاک و مشاوران مستقل.",
  keywords: [
    "نرم افزار املاک",
    "مدیریت فایل املاک",
    "سامانه مشاوران املاک",
    "نرم افزار مدیریت قرارداد ملک",
    "برنامه مدیریت املاک",
    "CRM املاک",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "آشیان",
    title: "آشیان | سامانه مدیریت املاک و فایل مشاوران",
    description:
      "فایل‌ها، قراردادها و پیگیری‌های دفتر املاکتان را در یک فضای ساده و منظم مدیریت کنید.",
    url: "/",
  },
};

const features = [
  {
    Icon: FileStack,
    title: "مدیریت فایل‌ها",
    body: "ثبت فایل‌های فروش و رهن‌ومستأجر با کد یکتا، مشخصات کامل، قیمت و وضعیت فعال تا آرشیو.",
  },
  {
    Icon: Building2,
    title: "پرونده مالک",
    body: "اطلاعات تماس، همه فایل‌ها و قراردادهای هر مالک در یک پرونده منظم و همیشه در دسترس.",
  },
  {
    Icon: KeyRound,
    title: "قراردادها",
    body: "ثبت قرارداد اجاره با تاریخ شروع و پایان، تمدید، و یادآوری خودکار پیش از سررسید.",
  },
  {
    Icon: PhoneCall,
    title: "پیگیری مشتری",
    body: "هر مشتری را با تاریخ پیگیری و وضعیت ثبت کنید و هیچ فرصتی از دست نرود.",
  },
  {
    Icon: CalendarCheck,
    title: "یادآوری‌ها",
    body: "یادآوری تماس، بازدید و کارهای روزانه دفتر، بدون نیاز به تقویم جداگانه.",
  },
  {
    Icon: UserCog,
    title: "اشتراک‌گذاری با همکاران",
    body: "دسترسی مشاوران به فایل‌ها را با سطح مجوز مشخص کنید: فقط مشاهده، ویرایش یا مدیریت کامل.",
  },
  {
    Icon: Images,
    title: "تصاویر و اشتراک‌گذاری سریع",
    body: "گالری تصاویر هر ملک با نمایش بزرگ، و آماده‌سازی متن آگهی برای ارسال در واتساپ و تلگرام.",
  },
  {
    Icon: ShieldCheck,
    title: "تاریخچه و امنیت",
    body: "ثبت کامل تغییرات هر فایل و دسترسی محدود به اعضای همان دفتر.",
  },
];

const steps = [
  {
    n: "۱",
    title: "ثبت‌نام دفتر",
    body: "نام دفتر، اطلاعات تماس و ساخت حساب مدیر.",
  },
  {
    n: "۲",
    title: "تأیید و فعال‌سازی",
    body: "پس از بررسی، حساب شما فعال می‌شود.",
  },
  {
    n: "۳",
    title: "شروع کار",
    body: "فایل‌ها را وارد کنید و با همکارانتان به اشتراک بگذارید.",
  },
];

export default function LandingPage() {
  return (
    <main id="main" className="lp">
      <span className="lp-blob a" aria-hidden="true" />
      <span className="lp-blob b" aria-hidden="true" />
      <header className="lp-header">
        <Link className="lp-logo" href="/">
          <House size={26} />
          <span>آشیان.</span>
        </Link>
        <nav className="lp-nav">
          <Link href="/login">ورود</Link>
          <Button asChild size="sm">
            <Link href="/register">ثبت‌نام دفتر</Link>
          </Button>
        </nav>
      </header>

      <section className="lp-hero">
        <span className="lp-blob c" aria-hidden="true" />
        <span className="eyebrow">فضای کار حرفه‌ای مشاوران املاک</span>
        <h1>
          هر فایل، یک فرصت.
          <br />
          هر ارتباط، یک آغاز.
        </h1>
        <p>
          فایل‌ها، قراردادها و پیگیری‌های دفترتان را در یک فضای ساده و منظم
          مدیریت کنید؛ به جای دفتر کاغذی، چند فایل و پیام‌رسان.
        </p>
        <div className="lp-cta">
          <Button asChild>
            <Link href="/register">شروع رایگان</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">ورود به حساب</Link>
          </Button>
        </div>
        <ul className="lp-badges">
          <li>
            <ShieldCheck size={16} /> داده‌ها فقط برای اعضای دفتر شما
          </li>
          <li>
            <Eye size={16} /> بدون نیاز به نصب، در مرورگر
          </li>
        </ul>
      </section>

      <section className="lp-section">
        <h2>هر آنچه یک دفتر املاک لازم دارد</h2>
        <div className="lp-grid">
          {features.map(({ Icon, title, body }) => (
            <article className="lp-card" key={title}>
              <span className="lp-card-icon">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-alt">
        <h2>پکیج‌های اشتراک</h2>
        <p className="lp-section-sub">
          پکیج مناسب دفترتان را انتخاب کنید. پرداخت کارت به کارت است و دسترسی
          بلافاصله پس از تأیید فعال می‌شود.
        </p>
        <LandingPricing />
      </section>

      <section className="lp-section lp-alt">
        <h2>در سه قدم شروع کنید</h2>
        <ol className="lp-steps">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="lp-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-cta-band">
        <h2>دفترتان را منظم‌تر کنید</h2>
        <p>
          امروز ثبت‌نام کنید و پس از تأیید، فایل‌ها و قراردادهای دفترتان را در
          یک جا نگه دارید.
        </p>
        <div className="lp-cta">
          <Button asChild>
            <Link href="/register">ثبت‌نام دفتر</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">ورود</Link>
          </Button>
        </div>
      </section>

      <footer className="lp-footer">
        <span>© {new Date().getFullYear()} آشیان</span>
        <span>همراه روزهای کاری شما</span>
      </footer>
    </main>
  );
}
