"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  createOrReactivateLink,
  getLinkForProperty,
  listAdCopies,
  revokeLink,
  saveAdCopy,
  updateLinkSettings,
} from "@/repositories/public-listings";
import { generateAdCopy } from "@/services/ad-copy";

export type ListingActionResult = {
  error?: string;
  success?: string;
  token?: string;
  content?: string;
  generator?: string;
  copies?: {
    id: string;
    variant: string;
    content: string;
    generator: string;
    editedByUser: boolean;
    updatedAt: Date;
  }[];
};

const idSchema = z.string().trim().min(1);
const variantSchema = z.enum(["DIVAR", "INSTAGRAM", "WHATSAPP", "CUSTOMER"]);
const fail = (error: unknown, fallback: string): ListingActionResult =>
  error instanceof Error ? { error: error.message } : { error: fallback };

export async function getPublicLink(
  _prev: ListingActionResult,
  form: FormData,
): Promise<ListingActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const [link, copies] = await Promise.all([
      getLinkForProperty(propertyId, user),
      listAdCopies(propertyId),
    ]);
    if ("error" in link && link.error) return { error: link.error };
    return { token: link.link?.token, copies };
  } catch (error) {
    return fail(error, "خواندن لینک انجام نشد.");
  }
}

export async function createPublicLink(
  _prev: ListingActionResult,
  form: FormData,
): Promise<ListingActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const result = await createOrReactivateLink(propertyId, user, {
      showPhone: form.get("showPhone") !== "false",
      showAddress: form.get("showAddress") === "true",
    });
    if ("error" in result && result.error) return result;
    revalidatePath(`/properties/${propertyId}`);
    return { success: "لینک آماده شد.", token: result.token };
  } catch (error) {
    return fail(error, "ساخت لینک انجام نشد.");
  }
}

export async function savePublicLinkSettings(
  _prev: ListingActionResult,
  form: FormData,
): Promise<ListingActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const result = await updateLinkSettings(propertyId, user, {
      isActive: form.get("isActive") === "true",
      showPhone: form.get("showPhone") === "true",
      showAddress: form.get("showAddress") === "true",
    });
    if (result.error) return result;
    revalidatePath(`/properties/${propertyId}`);
    return result;
  } catch (error) {
    return fail(error, "ذخیره تنظیمات انجام نشد.");
  }
}

export async function disablePublicLink(
  _prev: ListingActionResult,
  form: FormData,
): Promise<ListingActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const result = await revokeLink(propertyId, user);
    if (result.error) return result;
    revalidatePath(`/properties/${propertyId}`);
    return result;
  } catch (error) {
    return fail(error, "غیرفعال‌سازی لینک انجام نشد.");
  }
}

export async function generateAdCopyAction(
  _prev: ListingActionResult,
  form: FormData,
): Promise<ListingActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const variant = variantSchema.parse(form.get("variant"));
    const result = await generateAdCopy(propertyId, variant, user);
    if (result.error) return result;
    return { content: result.content, generator: result.generator };
  } catch (error) {
    return fail(error, "تولید آگهی انجام نشد.");
  }
}

export async function saveAdCopyAction(
  _prev: ListingActionResult,
  form: FormData,
): Promise<ListingActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const variant = variantSchema.parse(form.get("variant"));
    const content = z
      .string()
      .trim()
      .min(10, "متن آگهی خیلی کوتاه است.")
      .max(20000)
      .parse(form.get("content"));
    const generator = z.string().trim().max(60).parse(form.get("generator") || "");
    const result = await saveAdCopy(
      propertyId,
      variant,
      content,
      user,
      generator,
      true,
    );
    if (result.error) return result;
    revalidatePath(`/properties/${propertyId}`);
    return result;
  } catch (error) {
    if (error instanceof z.ZodError)
      return { error: error.issues[0]?.message ?? "متن نامعتبر است." };
    return fail(error, "ذخیره آگهی انجام نشد.");
  }
}
