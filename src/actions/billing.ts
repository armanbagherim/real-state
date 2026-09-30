"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { ensureReferralCode } from "@/repositories/billing";
import { parsePeriod, periodEnd, priceFor } from "@/lib/billing";
import { normalizeDigits, fa } from "@/lib/utils";
import { storage } from "@/services/storage";
import type { ActionResult } from "@/actions/manage";

const packageSchema = z.object({
  name: z.string().min(2, "نام پکیج لازم است.").max(60),
  description: z.string().max(300),
  monthlyPrice: z.coerce.number().int().min(0, "قیمت ماهانه نامعتبر است."),
  yearlyPrice: z.coerce.number().int().min(0, "قیمت سالانه نامعتبر است."),
  propertyLimit: z.coerce.number().int().min(0, "سقف فایل نامعتبر است."),
  agentLimit: z.coerce.number().int().min(1, "سقف مشاور نامعتبر است."),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "رنگ نامعتبر است.")
    .default("#147d70"),
  badge: z.string().max(20).default(""),
  active: z.boolean(),
});

async function assertSuperAdmin() {
  const user = await requireUser();
  if (!isSuperAdmin(user)) throw new Error("دسترسی غیرمجاز");
  return user;
}

export async function savePackage(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const data = packageSchema.parse({
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      monthlyPrice: normalizeDigits(String(form.get("monthlyPrice") ?? "")),
      yearlyPrice: normalizeDigits(String(form.get("yearlyPrice") ?? "")),
      propertyLimit: normalizeDigits(String(form.get("propertyLimit") ?? "")),
      agentLimit: normalizeDigits(String(form.get("agentLimit") ?? "")),
      color: String(form.get("color") ?? "#147d70"),
      badge: String(form.get("badge") ?? "").slice(0, 20),
      active: form.get("active") === "on",
    });
    const id = String(form.get("id") ?? "");
    if (id) await db.package.update({ where: { id }, data });
    else await db.package.create({ data });
    revalidatePath("/admin/packages");
    return { success: "پکیج ذخیره شد" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "ذخیره ناموفق" };
  }
}

export async function requestSubscription(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { error: "ابتدا وارد حساب خود شوید." };
  if (!user.officeId) return { error: "حساب شما به دفتری متصل نیست." };
  try {
    const packageId = String(form.get("packageId") ?? "");
    const note = String(form.get("buyerNote") ?? "").slice(0, 500);
    const file = form.get("receipt");
    const period = parsePeriod(String(form.get("period") ?? ""));
    const pkg = await db.package.findFirst({
      where: { id: packageId, active: true },
    });
    if (!pkg) return { error: "پکیج انتخاب‌شده در دسترس نیست." };
    const pending = await db.subscription.findFirst({
      where: { officeId: user.officeId, status: "AWAITING_RECEIPT" },
    });
    if (pending) return { error: "یک درخواست در انتظار بررسی دارید." };
    let receiptPath = "";
    if (file instanceof File && file.size > 0) {
      if (file.size > 8 * 1024 * 1024)
        return { error: "حجم رسید بیش از ۸ مگابایت است." };
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        return { error: "رسید باید تصویر JPG، PNG یا WebP باشد." };
      receiptPath = await storage.save(Buffer.from(await file.arrayBuffer()));
    }
    await db.subscription.create({
      data: {
        officeId: user.officeId,
        packageId,
        amount: priceFor(pkg, period),
        period,
        receiptPath,
        buyerNote: note,
        referredByUserId: user.referredByUserId ?? null,
      },
    });
    revalidatePath("/subscriptions");
    revalidatePath("/admin/subscriptions");
    return { success: "درخواست شما ثبت شد و پس از بررسی فعال می‌شود." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ثبت درخواست ناموفق",
    };
  }
}

async function referralIsFirst(referredByUserId: string | null) {
  if (!referredByUserId) return false;
  const prior = await db.commissionEntry.count({
    where: {
      userId: referredByUserId,
      subscription: {
        status: "ACTIVE",
        referredByUserId: referredByUserId,
      },
    },
  });
  return prior === 0;
}

export async function approveSubscription(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = String(form.get("id") ?? "");
    const subscription = await db.subscription.findUnique({
      where: { id },
      include: { package: true },
    });
    if (!subscription) return { error: "درخواست یافت نشد." };
    if (subscription.status !== "AWAITING_RECEIPT")
      return { error: "این درخواست قبلاً بررسی شده است." };

    const isFirst = await referralIsFirst(subscription.referredByUserId);
    let entry: { userId: string; percent: number; amount: number } | null =
      null;
    if (isFirst && subscription.referredByUserId) {
      const referrer = await db.user.findUnique({
        where: { id: subscription.referredByUserId },
        select: { commissionPercent: true },
      });
      if (referrer && referrer.commissionPercent > 0)
        entry = {
          userId: subscription.referredByUserId,
          percent: referrer.commissionPercent,
          amount: Math.floor(
            (subscription.amount * referrer.commissionPercent) / 100,
          ),
        };
    }

    const startsAt = new Date();
    const endsAt = periodEnd(startsAt, subscription.period);

    await db.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        startsAt,
        endsAt,
        approvedByUserId: admin.id,
        approvedAt: new Date(),
        referredByUserId: isFirst ? subscription.referredByUserId : null,
        ...(entry ? { commissionEntries: { create: [entry] } } : {}),
      },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/subscriptions");
    revalidatePath("/buy");
    revalidatePath("/finance");
    return { success: "اشتراک فعال شد" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "فعال‌سازی ناموفق",
    };
  }
}

export async function rejectSubscription(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const id = String(form.get("id") ?? "");
    const result = await db.subscription.updateMany({
      where: { id, status: "AWAITING_RECEIPT" },
      data: { status: "REJECTED" },
    });
    if (!result.count) return { error: "این درخواست قبلاً بررسی شده است." };
    revalidatePath("/admin/subscriptions");
    revalidatePath("/subscriptions");
    return { success: "درخواست رد شد" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "رد درخواست ناموفق",
    };
  }
}

export async function deletePackage(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    await assertSuperAdmin();
    const id = String(form.get("id") ?? "");
    const used = await db.subscription.count({ where: { packageId: id } });
    if (used > 0)
      return {
        error: `این پکیج در ${fa(
          used,
        )} اشتراک استفاده شده و قابل حذف نیست. می‌توانید آن را غیرفعال کنید.`,
      };
    const pkg = await db.package.findUnique({ where: { id } });
    if (!pkg) return { error: "پکیج یافت نشد." };
    await db.package.delete({ where: { id } });
    revalidatePath("/admin/packages");
    revalidatePath("/buy");
    revalidatePath("/subscriptions");
    return { success: `پکیج «${pkg.name}» حذف شد` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "حذف پکیج ناموفق",
    };
  }
}

export async function createReferralCode(): Promise<{
  code?: string;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const created = await ensureReferralCode(user.id);
    revalidatePath("/finance");
    return { code: created.code };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "ساخت کد ناموفق",
    };
  }
}
