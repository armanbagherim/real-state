import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/access";
import { Shell } from "@/components/shell";
import { SubscriptionRequired } from "@/components/subscription-required";
import { activeSubscription, ensureReferralCode } from "@/repositories/billing";
import { daysUntil } from "@/lib/billing";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "فضای کار",
  robots: { index: false, follow: false },
};
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const referral = await ensureReferralCode(user.id);
  const officeName =
    user.role === "SUPER_ADMIN" ? "مدیریت کل" : user.office?.name ?? "دفتر شما";
  const isSuper = isSuperAdmin(user);
  const subscription = isSuper ? null : await activeSubscription(user.officeId);
  if (!isSuper && !subscription)
    return (
      <SubscriptionRequired officeName={officeName} code={referral.code} />
    );
  const daysLeft = subscription?.endsAt ? daysUntil(subscription.endsAt) : 0;
  return (
    <Shell
      name={user.name}
      role={user.role}
      referralCode={referral.code}
      plan={
        subscription
          ? {
              name: subscription.package.name,
              color: subscription.package.color,
              daysLeft,
            }
          : isSuper
          ? { name: "مدیریت کل", color: "#122c25", daysLeft: 0 }
          : undefined
      }
      officeName={officeName}
    >
      {children}
    </Shell>
  );
}
