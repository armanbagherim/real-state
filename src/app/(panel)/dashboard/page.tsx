import { getDashboardData } from "@/repositories/office";
import Link from "next/link";
import {
  FolderOpen,
  Tags,
  KeyRound,
  CalendarClock,
  ArrowUpLeft,
  ArrowLeft,
  Plus,
  Phone,
  Check,
  Sun,
  CalendarDays,
  Bell,
  ChartNoAxesCombined,
} from "lucide-react";
import { fa, dateFa } from "@/lib/utils";
import { PageHeading, Empty } from "@/components/page-parts";
import { Button } from "@/components/ui/button";
import { PropertyTable } from "@/components/property-table";
import { RecordAction } from "@/components/record-actions";
export default async function Dashboard() {
  const {
    user,
    now,
    start,
    active,
    sale,
    rent,
    rented,
    sold,
    due,
    soon30,
    soon60,
    properties,
    tasks,
    contracts,
    reminders,
    recentFollowUps,
    monthly,
  } = await getDashboardData();
  const stats = [
    {
      label: "فایل‌های فعال",
      value: active,
      icon: FolderOpen,
      color: "teal",
      hint: "آماده برای یک معامله خوب",
      href: "/properties?status=ACTIVE",
    },
    {
      label: "فایل‌های فروش",
      value: sale,
      icon: Tags,
      color: "blue",
      hint: `${fa(sold)} معامله به سرانجام رسیده`,
      href: "/properties/sale",
    },
    {
      label: "فایل‌های اجاره",
      value: rent,
      icon: KeyRound,
      color: "purple",
      hint: `${fa(rented)} ملک اجاره داده شده`,
      href: "/properties/rent",
    },
    {
      label: "قراردادهای نزدیک به پایان",
      value: soon30,
      icon: CalendarClock,
      color: "amber",
      hint: `${fa(soon60)} قرارداد در ۶۰ روز آینده`,
      href: "/contracts?expiring=60",
    },
  ];
  return (
    <>
      <PageHeading
        title="داشبورد"
        description="نمایی روشن از امروز دفتر شما"
        action="ثبت فایل جدید"
        href="/properties/new"
      >
        <Button asChild variant="outline">
          <Link href="/follow-ups/new">
            <Plus size={17} /> ثبت پیگیری
          </Link>
        </Button>
      </PageHeading>
      <section className="welcome-banner">
        <div className="welcome-copy">
          <span className="eyebrow">
            <Sun size={16} /> به فضای کاری خود خوش آمدید
          </span>
          <h2>{user.name}، روز خوبی داشته باشید!</h2>
          <p>
            امروز <b>{fa(due)} پیگیری</b> در برنامه دارید. فرصت‌های تازه منتظر
            شما هستند.
          </p>
          <Link href="/follow-ups?today=true">
            برویم سراغ کارهای امروز <ArrowLeft size={16} />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-building b-one">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="art-building b-two">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="art-house">
            <div />
            <i />
            <i />
          </div>
          <span className="art-check">
            <Check size={23} />
          </span>
          <span className="art-leaf" />
        </div>
        <div className="welcome-date">
          <CalendarDays size={17} />
          {dateFa(now)}
        </div>
      </section>
      <section className="stats-grid" aria-label="آمار دفتر">
        {stats.map(({ label, value, icon: Icon, color, hint, href }) => (
          <Link href={href} className="stat-card" key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className={`stat-icon ${color}`}>
                <Icon size={21} />
              </span>
            </div>
            <div className="stat-number">
              {fa(value)}
              <ArrowUpLeft size={20} />
            </div>
            <div className="stat-hint">{hint}</div>
          </Link>
        ))}
      </section>
      <div className="dashboard-middle">
        <section className="panel today-panel">
          <div className="panel-heading">
            <div>
              <span className="section-icon teal">
                <CalendarDays size={19} />
              </span>
              <h2>کارهای امروز</h2>
              <span className="count-pill">{fa(due)}</span>
            </div>
            <Link href="/follow-ups">
              همه پیگیری‌ها <Chevron />
            </Link>
          </div>
          {tasks.length ? (
            <div className="task-list">
              {tasks.map((t) => (
                <div className="task-row" key={t.id}>
                  <RecordAction kind="follow-up" id={t.id} action="COMPLETED">
                    <span className="task-check" aria-label="انجام شد">
                      <Check size={13} />
                    </span>
                  </RecordAction>
                  <div className="task-copy">
                    <strong>{t.note}</strong>
                    <span>
                      {t.owner?.fullName ?? "پیگیری دفتر"}{" "}
                      {t.property && (
                        <>
                          {" "}
                          ·{" "}
                          <Link href={`/properties/${t.property.id}`} dir="ltr">
                            {t.property.fileCode}
                          </Link>
                        </>
                      )}
                    </span>
                  </div>
                  <span
                    className={`task-time ${
                      t.followUpDate < start ? "overdue" : ""
                    }`}
                  >
                    {t.followUpDate < start
                      ? "عقب‌افتاده"
                      : new Intl.DateTimeFormat("fa-IR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tehran",
                        }).format(t.followUpDate)}
                  </span>
                  {t.owner && (
                    <a
                      href={`tel:${t.owner.mobile}`}
                      className="call-icon"
                      aria-label={`تماس با ${t.owner.fullName}`}
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="برنامه امروز شما خلوت است"
              description="یک پیگیری تازه ثبت کنید و ارتباط‌ها را زنده نگه دارید."
              href="/follow-ups/new"
              action="ثبت پیگیری"
            />
          )}
          <Link className="panel-bottom-link" href="/follow-ups/new">
            <Plus size={16} /> افزودن پیگیری جدید
          </Link>
        </section>
        <section className="panel expiry-panel">
          <div className="panel-heading">
            <div>
              <span className="section-icon amber">
                <CalendarClock size={19} />
              </span>
              <h2>زمان تمدید نزدیک است</h2>
            </div>
            <Link href="/contracts?expiring=60">
              <Chevron />
            </Link>
          </div>
          <p className="panel-description">
            با یک تماس به‌موقع، فرصت بعدی را بسازید.
          </p>
          {contracts.length ? (
            contracts.map((c) => {
              const days = Math.ceil(
                (c.endDate.getTime() - now.getTime()) / 86400000,
              );
              return (
                <div className="expiry-row" key={c.id}>
                  <div className="row-between">
                    <Link href={`/contracts/${c.id}`}>
                      <strong>{c.property.title}</strong>
                    </Link>
                    <span className={`days-pill ${days <= 14 ? "urgent" : ""}`}>
                      {days < 0 ? "پایان‌یافته" : `${fa(days)} روز مانده`}
                    </span>
                  </div>
                  <div className="expiry-meta">
                    <span>
                      {c.owner.fullName} <i>·</i>{" "}
                      <b dir="ltr">{c.property.fileCode}</b>
                    </span>
                    <a href={`tel:${c.owner.mobile}`} dir="ltr">
                      {c.owner.mobile}
                      <Phone size={13} />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty
              title="قراردادی نزدیک به پایان نیست"
              description="یادآوری‌های تمدید به‌صورت خودکار اینجا دیده می‌شوند."
            />
          )}
          <Link href="/contracts" className="panel-bottom-link">
            مشاهده همه قراردادها <ArrowLeft size={15} />
          </Link>
        </section>
      </div>
      <section className="panel latest-panel">
        <div className="panel-heading">
          <div>
            <span className="section-icon teal">
              <FolderOpen size={19} />
            </span>
            <h2>جدیدترین فایل‌ها</h2>
          </div>
          <Link href="/properties">
            مشاهده همه فایل‌ها <Chevron />
          </Link>
        </div>
        <PropertyTable items={properties} compact />
      </section>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-icon purple">
                <Bell size={19} />
              </span>
              <h2>یادآوری‌های مهم</h2>
            </div>
            <Link href="/reminders">
              <Chevron />
            </Link>
          </div>
          {reminders.length ? (
            reminders.map((r) => (
              <Link className="activity-row" href="/reminders" key={r.id}>
                <span className="activity-dot" />
                <div>
                  <strong>{r.title}</strong>
                  <small>
                    {r.owner?.fullName} · {dateFa(r.remindAt)}
                  </small>
                </div>
                <ArrowUpLeft size={16} />
              </Link>
            ))
          ) : (
            <p className="panel-empty-text">
              همه‌چیز مرتب است؛ یادآوری سررسیدشده‌ای ندارید.
            </p>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-icon blue">
                <ChartNoAxesCombined size={19} />
              </span>
              <h2>نبض دفتر</h2>
            </div>
            <span className="muted text-small">۳۰ روز گذشته</span>
          </div>
          <div className="office-pulse">
            {monthly.map((m) => (
              <div key={m.transactionType}>
                <span>
                  {m.transactionType === "SALE"
                    ? "فایل فروش جدید"
                    : "فایل اجاره جدید"}
                </span>
                <strong>{fa(m._count)}</strong>
                <div className="mini-bar">
                  <i
                    style={{
                      width: `${Math.max(
                        5,
                        (m._count /
                          Math.max(
                            1,
                            monthly.reduce((s, x) => s + x._count, 0),
                          )) *
                          100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {recentFollowUps[0] && (
            <div className="last-activity">
              آخرین فعالیت: {recentFollowUps[0].note}{" "}
              <span>{dateFa(recentFollowUps[0].createdAt)}</span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function Chevron() {
  return <ArrowLeft size={14} />;
}
