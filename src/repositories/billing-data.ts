import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin, isOfficeAdmin } from "@/lib/access";
import { ensureReferralCode, officeQuota } from "@/repositories/billing";

export async function getMySubscriptionData() {
  const user = await requireUser();
  const [packages, mine, quota] = await Promise.all([
    db.package.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
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
  const [pending, history, people] = await Promise.all([
    db.subscription.findMany({
      where: { status: "AWAITING_RECEIPT" },
      include: { office: true, package: true },
      orderBy: { createdAt: "asc" },
    }),
    db.subscription.findMany({
      include: { office: true, package: true, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    db.user.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, mobile: true, office: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);
  return { pending, history, people };
}

export async function getPackagesAdminData() {
  const user = await requireUser();
  if (!isSuperAdmin(user)) return null;
  return {
    packages: await db.package.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }] }),
  };
}

export async function getFinanceData() {
  const user = await requireUser();
  const myCode = await ensureReferralCode(user.id);
  const base = {
    code: myCode.code,
    isManager: isSuperAdmin(user) || isOfficeAdmin(user),
  };
  const [mine, earnings, total] = await Promise.all([
    db.commissionEntry.findMany({
      where: { userId: user.id },
      include: {
        subscription: {
          include: { office: true, package: true, approvedAt: true },
        },
      },
      orderBy: { id: "desc" },
      take: 100,
    }),
    db.commissionEntry.groupBy({
      by: ["userId"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 50,
    }),
    db.subscription.aggregate({
      where: { status: "ACTIVE" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);
  const people = await db.user.findMany({
    where: { id: { in: earnings.map((e) => e.userId) } },
    select: { id: true, name: true },
  });
  const names = new Map(people.map((p) => [p.id, p.name]));
  return {
    ...base,
    mine,
    totalRevenue: total._sum.amount ?? 0,
    salesCount: total._count,
    leaderboard: earnings.map((e) => ({
      userId: e.userId,
      name: names.get(e.userId) ?? e.userId,
      amount: e._sum.amount ?? 0,
    })),
  };
}
