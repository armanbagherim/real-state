import Link from "next/link";
import {
  BadgePercent,
  CalendarRange,
  HandCoins,
  RefreshCw,
  TicketCheck,
  Users,
} from "lucide-react";
import { PageHeading } from "@/components/page-parts";
import { getFinanceData } from "@/repositories/billing-data";
import {
  ReferralCodeView,
  RecalculateButton,
} from "@/components/billing-forms";
import { Badge } from "@/components/page-parts";
import { money, dateFa, fa } from "@/lib/utils";

const RANGES = [
  { key: "all", label: "همه" },
  { key: "30", label: "۳۰ روز" },
  { key: "90", label: "۹۰ روز" },
];

function Stat({
  Icon,
  label,
  value,
  tone = "",
}: {
  Icon: typeof Users;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <span className="stat-icon">
        <Icon size={17} />
      </span>
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const data = await getFinanceData(range);
  const conversion =
    data.invited > 0
      ? Math.round((data.referredSales / data.invited) * 100)
      : 0;

  return (
    <>
      <PageHeading
        title="مالی و کمیسیون"
        description="درآمد، دعوت‌ها و فروش‌های مربوط به خودتان"
      >
        <form className="range-picker">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              className={`range-chip${(range ?? "all") === r.key ? " on" : ""}`}
              href={r.key === "all" ? "/finance" : `/finance?range=${r.key}`}
            >
              {r.label}
            </Link>
          ))}
        </form>
        {data.isManager && <RecalculateButton />}
      </PageHeading>

      <div className="stat-row">
        <Stat
          Icon={HandCoins}
          label="کل درآمد شما از کمیسیون"
          value={money(String(data.myTotal))}
          tone="primary"
        />
        <Stat
          Icon={BadgePercent}
          label="درصد کمیسیون شما"
          value={`${fa(data.percent)}٪`}
        />
        <Stat
          Icon={Users}
          label="افراد دعوت‌شده توسط شما"
          value={fa(data.invited)}
        />
        <Stat
          Icon={TicketCheck}
          label="تبدیل به خرید"
          value={`${fa(data.referredSales)} نفر · ${fa(conversion)}٪`}
        />
      </div>

      {data.isManager && (
        <div className="stat-row">
          <Stat
            Icon={CalendarRange}
            label="مجموع فروش اشتراک (کل سیستم)"
            value={money(String(data.totalRevenue))}
          />
          <Stat
            Icon={TicketCheck}
            label="تعداد اشتراک فعال"
            value={fa(data.salesCount)}
          />
        </div>
      )}

      <div className="panel detail-panel">
        <h2>کد معرف شما</h2>
        <ReferralCodeView code={data.code} />
      </div>

      <div className="panel detail-panel">
        <h2>کمیسیون‌های شما</h2>
        {data.mine.length ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>دفتر</th>
                  <th>پکیج</th>
                  <th>درصد</th>
                  <th>مبلغ فروش</th>
                  <th>کمیسیون شما</th>
                  <th>تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {data.mine.map((e) => (
                  <tr key={e.id}>
                    <td>{e.subscription.office.name}</td>
                    <td>{e.subscription.package.name}</td>
                    <td>{fa(e.percent)}٪</td>
                    <td>{money(String(e.subscription.amount))}</td>
                    <td>
                      <b className="amount-positive">
                        {money(String(e.amount))}
                      </b>
                    </td>
                    <td>
                      {dateFa(
                        e.subscription.approvedAt ?? e.subscription.createdAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            هنوز کمیسیونی برای شما ثبت نشده است. اگر درصد کمیسیون خود را تغییر
            داده‌اید، دکمه «به‌روزرسانی درآمد» را بزنید.
          </p>
        )}
      </div>

      <div className="panel detail-panel">
        <h2>دعوت‌های شما و وضعیت خرید</h2>
        {data.referred.length ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>دفتر</th>
                  <th>پکیج</th>
                  <th>مبلغ</th>
                  <th>وضعیت</th>
                  <th>تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody>
                {data.referred.map((s) => (
                  <tr key={s.id}>
                    <td>{s.office.name}</td>
                    <td>{s.package.name}</td>
                    <td>{money(String(s.amount))}</td>
                    <td>
                      <Badge value={s.status} />
                    </td>
                    <td>{dateFa(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            هنوز کسی با کد معرف شما ثبت‌نام نکرده است. کد را برای همکارانتان
            بفرستید.
          </p>
        )}
      </div>

      <p className="finance-note">
        <RefreshCw size={14} />
        کمیسیون هنگام تأیید اشتراک با درصد همان لحظه محاسبه می‌شود. اگر درصد خود
        را تغییر دادید، از دکمه «به‌روزرسانی درآمد» استفاده کنید.
      </p>
    </>
  );
}
