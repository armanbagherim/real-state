"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { money } from "@/lib/utils";
import type { ActionResult } from "@/actions/manage";

export async function recalculateCommissions(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!isSuperAdmin(user))
      return { error: "فقط مدیر کل می‌تواند کمیسیون‌ها را بازمحاسبه کند." };

    const subscriptions = await db.subscription.findMany({
      where: { status: "ACTIVE", referredByUserId: { not: null } },
      include: {
        referredBy: { select: { id: true, commissionPercent: true } },
        commissionEntries: { select: { id: true, userId: true } },
      },
    });

    let created = 0;
    let updated = 0;
    let removed = 0;
    let total = 0;

    for (const sub of subscriptions) {
      const referrer = sub.referredBy;
      const percent = referrer?.commissionPercent ?? 0;
      const existing = sub.commissionEntries[0];

      if (!referrer || percent <= 0) {
        if (existing) {
          await db.commissionEntry.delete({ where: { id: existing.id } });
          removed++;
        }
        continue;
      }

      const amount = Math.floor((sub.amount * percent) / 100);
      total += amount;

      if (existing) {
        await db.commissionEntry.update({
          where: { id: existing.id },
          data: { percent, amount, userId: referrer.id },
        });
        updated++;
      } else {
        await db.commissionEntry.create({
          data: {
            subscriptionId: sub.id,
            userId: referrer.id,
            percent,
            amount,
          },
        });
        created++;
      }
    }

    revalidatePath("/finance");
    revalidatePath("/users");
    revalidatePath("/admin/subscriptions");

    const parts = [
      created ? `${created} جدید` : "",
      updated ? `${updated} به‌روزشده` : "",
      removed ? `${removed} حذف‌شده` : "",
    ].filter(Boolean);
    return {
      success: `بازمحاسبه انجام شد${
        parts.length ? ` (${parts.join("، ")})` : ""
      } · مجموع کمیسیون ${money(String(total))}`,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "بازمحاسبه ناموفق",
    };
  }
}
