import { randomBytes } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { makeReferralCode, quotaFor, type Quota } from "@/lib/billing";
import { isSuperAdmin, type CurrentUser } from "@/lib/access";

export async function officeQuota(
  officeId: string | null,
  client: PrismaClient | Prisma.TransactionClient = db,
): Promise<Quota> {
  if (!officeId)
    return quotaFor({
      officeId,
      used: 0,
      hasSubscriptionHistory: false,
      active: null,
    });
  const [used, history, active] = await Promise.all([
    client.property.count({ where: { officeId, deletedAt: null } }),
    client.subscription.count({ where: { officeId } }),
    client.subscription.findFirst({
      where: { officeId, status: "ACTIVE", endsAt: { gt: new Date() } },
      include: { package: { select: { propertyLimit: true } } },
      orderBy: { endsAt: "desc" },
    }),
  ]);
  return quotaFor({
    officeId,
    used,
    hasSubscriptionHistory: history > 0,
    active: active
      ? { propertyLimit: active.package.propertyLimit, endsAt: active.endsAt }
      : null,
  });
}

export async function activeSubscription(officeId: string | null) {
  if (!officeId) return null;
  return db.subscription.findFirst({
    where: { officeId, status: "ACTIVE", endsAt: { gt: new Date() } },
    include: { package: true },
    orderBy: { endsAt: "desc" },
  });
}

export async function canCreateProperty(user: CurrentUser): Promise<Quota> {
  if (isSuperAdmin(user))
    return quotaFor({
      officeId: null,
      used: 0,
      hasSubscriptionHistory: false,
      active: null,
    });
  return officeQuota(user.officeId);
}

export async function ensureReferralCode(userId: string) {
  const existing = await db.referralCode.findUnique({ where: { userId } });
  if (existing) return existing;
  for (let i = 0; i < 6; i++) {
    const code = makeReferralCode(randomBytes);
    try {
      return await db.referralCode.create({ data: { code, userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        continue;
      throw error;
    }
  }
  throw new Error("Could not allocate a referral code");
}

export async function findReferral(code: string) {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  return db.referralCode.findUnique({
    where: { code: clean },
    include: {
      user: { select: { id: true, referredByUserId: true } },
      property: { select: { id: true, title: true } },
    },
  });
}
