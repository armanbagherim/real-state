import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin, isOfficeAdmin } from "@/lib/access";
import { ensureReferralCode, officeQuota } from "@/repositories/billing";

export async function getMySubscriptionData() {
  const user = await requireUser();
  const [packages, mine, quota] = await Promise.all([
    db.package.findMany({
      where: { active: true, internal: false },
      orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
    }),
    db.subscription.findMany({
      where: { officeId: user.officeId ?? "__none__" },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    }),
    officeQuota(user.officeId),
  ]);
  return { packages, mine, quota };
}

export async function getAdminSubscriptionsData() {
  const user = await requireUser();
  if (!isSuperAdmin(user)) return null;
  const [pending, history] = await Promise.all([
    db.subscription.findMany({
      where: { status: "AWAITING_RECEIPT" },
      include: {
        office: true,
        package: true,
        referredBy: { select: { name: true, commissionPercent: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.subscription.findMany({
      include: {
        office: true,
        package: true,
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);
  return { pending, history };
}

export async function getPackagesAdminData() {
  const user = await requireUser();
  if (!isSuperAdmin(user)) return null;
  return {
    packages: await db.package.findMany({
      orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
    }),
  };
}

export async function getFinanceData(range?: string) {
  const user = await requireUser();
  const myCode = await ensureReferralCode(user.id);
  const from =
    range === "30" ? new Date(Date.now() - 30 * 86400000) : undefined;
  const from90 =
    range === "90" ? new Date(Date.now() - 90 * 86400000) : undefined;
  const since = from ?? from90;

  const [mine, invited, referredSales, total, all] = await Promise.all([
    db.commissionEntry.findMany({
      where: {
        userId: user.id,
        ...(since ? { subscription: { approvedAt: { gte: since } } } : {}),
      },
      include: {
        subscription: { include: { office: true, package: true } },
      },
      orderBy: { id: "desc" },
      take: 200,
    }),
    db.user.count({ where: { referredByUserId: user.id } }),
    db.subscription.count({
      where: {
        referredByUserId: user.id,
        status: { not: "REJECTED" },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    }),
    db.subscription.aggregate({
      where: {
        status: "ACTIVE",
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
    db.subscription.findMany({
      where: { referredByUserId: user.id },
      include: { office: true, package: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    code: myCode.code,
    percent: user.commissionPercent,
    isManager: isSuperAdmin(user) || isOfficeAdmin(user),
    mine,
    invited,
    referredSales,
    referred: all,
    myTotal: mine.reduce((acc, e) => acc + e.amount, 0),
    totalRevenue: total._sum.amount ?? 0,
    salesCount: total._count,
  };
}
