"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { propertyCanEditWhere } from "@/lib/access";
import { normalizeDigits } from "@/lib/utils";
import { parsePeriod, periodEnd, priceFor } from "@/lib/billing";
import type { ActionResult } from "@/actions/manage";

export async function togglePropertyAccess(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(form.get("id") ?? "");
  try {
    const property = await db.property.findFirst({
      where: { id, deletedAt: null, AND: [propertyCanEditWhere(user)] },
      select: { id: true, accessBlockedAt: true },
    });
    if (!property) return { error: "فایل یافت نشد." };
    await db.property.update({
      where: { id: property.id },
      data: { accessBlockedAt: property.accessBlockedAt ? null : new Date() },
    });
    revalidatePath("/properties");
    return {
      success: property.accessBlockedAt
        ? "دسترسی فایل باز شد"
        : "دسترسی فایل مسدود شد",
    };
  } catch {
    return { error: "تغییر وضعیت انجام نشد." };
  }
}

export async function assignSubscription(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!isSuperAdmin(user))
      return { error: "فقط مدیر کل می‌تواند اشتراک تخصیص دهد." };
    const officeId = String(form.get("officeId") ?? "");
    const packageId = String(form.get("packageId") ?? "");
    const parsed = z.string().min(1).safeParse(officeId);
    if (!parsed.success) return { error: "دفتر انتخاب نشده است." };
    const pkg = await db.package.findUnique({ where: { id: packageId } });
    if (!pkg) return { error: "پکیج انتخاب‌شده یافت نشد." };
    const office = await db.office.findUnique({ where: { id: officeId } });
    if (!office) return { error: "دفتر یافت نشد." };
    const period = parsePeriod(String(form.get("period") ?? ""));
    const endsAt = periodEnd(new Date(), period);
    await db.subscription.create({
      data: {
        officeId,
        packageId,
        period,
        status: "ACTIVE",
        amount: priceFor(pkg, period),
        startsAt: new Date(),
        endsAt,
        approvedByUserId: user.id,
        approvedAt: new Date(),
        buyerNote: `تخصیص دستی توسط مدیر کل · فایل ${normalizeDigits(
          String(form.get("fileCode") ?? ""),
        )}`,
      },
    });
    revalidatePath("/properties");
    revalidatePath("/admin/subscriptions");
    return { success: `اشتراک «${pkg.name}» به ${office.name} تخصیص یافت` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "تخصیص اشتراک ناموفق",
    };
  }
}
