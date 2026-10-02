import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Chrome,
  Download,
  FolderOpen,
  LogIn,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    icon: Download,
    title: "دریافت فایل افزونه",
    body: "پوشه extension را از بسته‌ای که مدیر سیستم در اختیار شما گذاشته دریافت و از حالت فشرده خارج کنید. پوشه را حذف یا جابه‌جا نکنید.",
  },
  {
    icon: Chrome,
    title: "باز کردن صفحه افزونه‌های Chrome",
    body: "در نوار آدرس Chrome عبارت زیر را وارد کنید:",
    code: "chrome://extensions",
  },
  {
    icon: ShieldCheck,
    title: "فعال کردن حالت توسعه‌دهنده",
    body: "کلید Developer mode را از گوشه بالای صفحه روشن کنید.",
  },
  {
    icon: FolderOpen,
    title: "بارگذاری افزونه",
    body: "روی Load unpacked بزنید و خود پوشه extension را انتخاب کنید؛ باید فایلی مثل manifest.json مستقیماً داخل همان پوشه باشد.",
  },
  {
    icon: LogIn,
    title: "ورود و شروع کار",
    body: "روی آیکون افزونه بزنید، با نام کاربری آشیان وارد شوید و سپس یک آگهی در دیوار یا AmlakPlus باز کنید.",
  },
];

export default function ExtensionGuidePage() {
  return (
    <main id="main" className="extension-guide">
      <header className="extension-guide__header">
        <Link href="/login" className="extension-guide__back">
          ورود به آشیان <ArrowLeft size={17} />
        </Link>
        <div className="extension-guide__brand">
          <span className="extension-guide__brand-icon"><Chrome size={23} /></span>
          <span>آشیان <b>+</b></span>
        </div>
      </header>

      <section className="extension-guide__hero">
        <span className="extension-guide__eyebrow">راهنمای ابزار ورود فایل</span>
        <h1>نصب افزونه آشیان برای Chrome</h1>
        <p>
          با این افزونه می‌توانید آگهی‌های دیوار و AmlakPlus را مستقیم به فایل‌های آشیان اضافه کنید.
        </p>
        <div className="extension-guide__hero-actions">
          <a className="btn btn-primary" href="#install">
            شروع نصب <ArrowLeft size={17} />
          </a>
          <span className="extension-guide__version">نسخه داخلی سازمانی</span>
        </div>
      </section>

      <section id="install" className="extension-guide__section">
        <div className="extension-guide__section-heading">
          <span className="extension-guide__section-icon"><Download size={20} /></span>
          <div>
            <span className="extension-guide__eyebrow">نصب دستی امن</span>
            <h2>در چند دقیقه آماده استفاده شوید</h2>
          </div>
        </div>
        <div className="extension-guide__steps">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="extension-guide__step" key={step.title}>
                <span className="extension-guide__step-number">{index + 1}</span>
                <span className="extension-guide__step-icon"><Icon size={20} /></span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {step.code && <code className="extension-guide__code">{step.code}</code>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="extension-guide__columns">
        <article className="extension-guide__panel">
          <div className="extension-guide__panel-title"><Check size={19} /> بعد از نصب</div>
          <ul>
            <li>اگر کد افزونه کنار نوار آدرس نیست، از منوی پازل آن را Pin کنید.</li>
            <li>بعد از هر به‌روزرسانی، در صفحه extensions روی Reload بزنید.</li>
            <li>برای ثبت ملک، ابتدا از داخل پنجره افزونه وارد حساب آشیان شوید.</li>
          </ul>
        </article>
        <article className="extension-guide__panel extension-guide__panel--notice">
          <div className="extension-guide__panel-title"><AlertTriangle size={19} /> اگر افزونه کار نکرد</div>
          <ul>
            <li>مطمئن شوید صفحه با آدرس اصلی divar.ir، amlakplus.app یا kashano.ir باز شده است.</li>
            <li>صفحه آگهی را refresh کنید و افزونه را دوباره Reload کنید.</li>
            <li>اگر خطای API دیدید، از مدیر سیستم بخواهید نسخه جدید آشیان را deploy کند.</li>
          </ul>
        </article>
      </section>

      <section className="extension-guide__auto-install">
        <div className="extension-guide__auto-icon"><RefreshCw size={22} /></div>
        <div>
          <h2>آیا نصب خودکار بدون Chrome Web Store ممکن است؟</h2>
          <p>
            برای کاربران عادی Chrome، نصب خودکار افزونه خارج از Web Store مجاز نیست. روش فعلی Load unpacked است. نصب خودکار فقط در کامپیوترهای سازمانیِ تحت مدیریت، با Chrome Enterprise Policy یا ابزار مدیریت دستگاه امکان‌پذیر است.
          </p>
        </div>
      </section>

      <footer className="extension-guide__footer">
        راهنمای نصب افزونه آشیان <span>•</span> پشتیبانی با مدیر سیستم
      </footer>
    </main>
  );
}
