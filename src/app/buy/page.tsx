import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { logout } from "@/actions/auth";
import { activeSubscription, ensureReferralCode } from "@/repositories/billing";
import { BuyFlow } from "@/components/buy-flow";
import { RequestStatus } from "@/components/billing-forms";
import { money, fa } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "خرید اشتراک | آشیان",
  robots: { index: false, follow: true },
};

export default async function BuyPage() {
  const user = await getUser();
  const packages = await db.package.findMany({
    where: { active: true, internal: false },
    orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
  });
  const officeId = user && !isSuperAdmin(user) ? user.officeId : null;
  const active = await activeSubscription(officeId);
  const mine = officeId
    ? await db.subscription.findMany({
        where: { officeId },
        include: { package: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    : [];
  const code = user ? (await ensureReferralCode(user.id)).code : null;

  if (user?.status === "APPROVED" && active) redirect("/dashboard");

  return (
    <main id="main" className="buy-page">
      <header className="buy-header">
        <strong>آشیان.</strong>
        {user ? (
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut size={15} />
              خروج
            </Button>
          </form>
        ) : (
          <div className="buy-nav">
            <Link className="text-link" href="/login">
              ورود
            </Link>
            <Button asChild size="sm">
              <Link href="/register">ثبت‌نام</Link>
            </Button>
          </div>
        )}
      </header>

      <section className="buy-hero">
        <h1>خرید اشتراک آشیان</h1>
        <p className="muted">
          {user
            ? "پکیج را انتخاب کنید، مبلغ را کارت به کارت واریز کنید و رسید را ثبت کنید."
            : "برای خرید ابتدا ثبت‌نام کنید؛ سپس پکیج را انتخاب و رسید را ثبت می‌کنید."}
        </p>
        {code && (
          <p className="buy-ref">
            کد معرف شما: <b dir="ltr">{code}</b>
          </p>
        )}
        {!user && (
          <div className="buy-cta">
            <Button asChild>
              <Link href="/register">ثبت‌نام و ادامه</Link>
            </Button>
          </div>
        )}
      </section>

      {user ? (
        <BuyFlow packages={packages}>
          <details className="buy-history-details">
            <summary>تاریخچه پرداخت‌ها</summary>
            <RequestStatus items={mine} />
          </details>
        </BuyFlow>
      ) : (
        <div className="panel detail-panel">
          <h2>پکیج‌ها</h2>
          <div className="package-grid">
            {packages.map((p) => (
              <article className="package-card" key={p.id}>
                <h3>{p.name}</h3>
                {p.description && <p className="muted">{p.description}</p>}
                <div className="package-prices">
                  <div>
                    <b>{money(String(p.monthlyPrice))}</b>
                    <span>ماهانه</span>
                  </div>
                  <div>
                    <b>{money(String(p.yearlyPrice))}</b>
                    <span>سالانه</span>
                  </div>
                </div>
                <ul className="package-specs">
                  <li>تا {fa(p.propertyLimit)} فایل</li>
                  <li>تا {fa(p.agentLimit)} مشاور</li>
                </ul>
                <Button asChild variant="outline" size="sm">
                  <Link href="/register">برای خرید ثبت‌نام کنید</Link>
                </Button>
              </article>
            ))}
            {!packages.length && (
              <p className="muted">در حال حاضر پکیجی برای فروش موجود نیست.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
