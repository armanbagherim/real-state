"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/access";
import { computeCommission, type Split } from "@/lib/billing";
import { ensureReferralCode, findReferral } from "@/repositories/billing";
import { normalizeDigits } from "@/lib/utils";
import { storage } from "@/services/storage";
import type { ActionResult } from "@/actions/manage";

const packageSchema = z.object({
  name: z.string().min(2, "نام پکیج لازم است.").max(60),
  description: z.string().max(300),
  price: z.coerce.number().int().min(0, "قیمت نامعتبر است."),
  durationDays: z.coerce.number().int().min(1, "مدت اشتراک نامعتبر است."),
  propertyLimit: z.coerce.number().int().min(0, "سقف فایل نامعتبر است."),
  agentLimit: z.coerce.number().int().min(1, "سقف مشاور نامعتبر است."),
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
      price: normalizeDigits(String(form.get("price") ?? "")),
      durationDays: normalizeDigits(String(form.get("durationDays") ?? "")),
      propertyLimit: normalizeDigits(String(form.get("propertyLimit") ?? "")),
      agentLimit: normalizeDigits(String(form.get("agentLimit") ?? "")),
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
  const user = await requireUser();
  if (!user.officeId) return { error: "حساب شما به دفتری متصل نیست." };
  try {
    const packageId = String(form.get("packageId") ?? "");
    const note = String(form.get("buyerNote") ?? "").slice(0, 500);
    const file = form.get("receipt");
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
    const referral = await findReferral(String(form.get("referralCode") ?? ""));
    await db.subscription.create({
      data: {
        officeId: user.officeId,
        packageId,
        amount: pkg.price,
        receiptPath,
        buyerNote: note,
        referredByUserId: referral?.userId ?? null,
        referralCode: referral?.code ?? "",
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

    const users = form.getAll("userId").map(String);
    const percents = form.getAll("percent").map(String);
    const splits: Split[] = [];
    for (let i = 0; i < users.length; i++) {
      if (!users[i]) continue;
      splits.push({
        userId: users[i],
        percent: Number(normalizeDigits(percents[i] ?? "")),
      });
    }
    const commission = computeCommission(subscription.amount, splits);
    if (!commission.ok) return { error: commission.error };

    const isFirst = await referralIsFirst(subscription.referredByUserId);
    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + subscription.package.durationDays);

    await db.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        startsAt,
        endsAt,
        approvedByUserId: admin.id,
        approvedAt: new Date(),
        referredByUserId: isFirst ? subscription.referredByUserId : null,
        commissionEntries: {
          create: commission.entries.map((e) => ({
            userId: e.userId,
            percent: e.percent,
            amount: e.amount,
          })),
        },
      },
    });
    revalidatePath("/admin/subscriptions");
    revalidatePath("/subscriptions");
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

export async function createReferralCode() {
  const user = await requireUser();
  const created = await ensureReferralCode(user.id);
  revalidatePath("/finance");
  return { code: created.code };
}
