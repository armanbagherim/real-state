import { randomBytes } from "node:crypto";
import type { AdCopyVariant, Prisma, PublicListingEventType } from "@prisma/client";
import { db } from "@/lib/db";
import { propertyCanEditWhere } from "@/lib/access";
import type { CurrentUser } from "@/lib/access";

/** Unambiguous alphabet: no 0/O, 1/l/I. Short enough to paste over WhatsApp. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function generateToken(length = 10) {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1)
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

async function uniqueToken(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = generateToken();
    const clash = await db.propertyPublicLink.findUnique({
      where: { token },
      select: { id: true },
    });
    if (!clash) return token;
  }
  // Astronomically unlikely; keeps the guarantee explicit rather than silent.
  throw new Error("تولید لینک یکتا ممکن نشد؛ دوباره تلاش کنید.");
}

export async function getLinkForProperty(propertyId: string, user: CurrentUser) {
  const allowed = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    select: { id: true },
  });
  if (!allowed) return { error: "این فایل برای شما در دسترس نیست." };
  const link = await db.propertyPublicLink.findUnique({
    where: { propertyId },
    select: {
      id: true,
      token: true,
      isActive: true,
      showAddress: true,
      showPhone: true,
      views: true,
      phoneClicks: true,
      visitRequests: true,
      lastViewedAt: true,
      createdAt: true,
    },
  });
  return { link };
}

/** One link per property: creating an existing one just reactivates it. */
export async function createOrReactivateLink(
  propertyId: string,
  user: CurrentUser,
  options?: { showAddress?: boolean; showPhone?: boolean },
) {
  const allowed = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    select: { id: true },
  });
  if (!allowed) return { error: "این فایل برای شما در دسترس نیست." };
  const existing = await db.propertyPublicLink.findUnique({
    where: { propertyId },
    select: { id: true, token: true },
  });
  if (existing) {
    const row = await db.propertyPublicLink.update({
      where: { id: existing.id },
      data: { isActive: true, ...(options ?? {}) },
      select: { token: true },
    });
    return { token: row.token };
  }
  const created = await db.propertyPublicLink.create({
    data: {
      token: await uniqueToken(),
      propertyId,
      createdByUserId: user.id,
      isActive: true,
      ...(options ?? {}),
    },
    select: { token: true },
  });
  return { token: created.token };
}

export async function updateLinkSettings(
  propertyId: string,
  user: CurrentUser,
  data: { isActive?: boolean; showAddress?: boolean; showPhone?: boolean },
) {
  const allowed = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    select: { id: true },
  });
  if (!allowed) return { error: "این فایل برای شما در دسترس نیست." };
  const row = await db.propertyPublicLink.updateMany({
    where: { propertyId },
    data,
  });
  if (!row.count) return { error: "ابتدا لینک را بسازید." };
  return { success: "تنظیمات لینک ذخیره شد." };
}

export async function revokeLink(propertyId: string, user: CurrentUser) {
  const allowed = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    select: { id: true },
  });
  if (!allowed) return { error: "این فایل برای شما در دسترس نیست." };
  const row = await db.propertyPublicLink.updateMany({
    where: { propertyId },
    data: { isActive: false },
  });
  if (!row.count) return { error: "لینکی برای این فایل وجود ندارد." };
  return { success: "لینک غیرفعال شد." };
}

/** Public read. Never throws on missing links — always returns null. */
export async function getActivePublicListing(token: string) {
  if (!/^[a-z2-9]{8,16}$/.test(token)) return null;
  const link = await db.propertyPublicLink.findFirst({
    where: { token, isActive: true, property: PUBLICLY_VISIBLE },
    include: {
      property: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          ownerUser: { select: { name: true, mobile: true } },
          office: { select: { name: true, phone: true } },
        },
      },
    },
  });
  if (!link) return null;
  return link;
}

const COUNTER: Partial<Record<PublicListingEventType, "views" | "phoneClicks" | "visitRequests">> = {
  VIEW: "views",
  PHONE_CLICK: "phoneClicks",
  VISIT_REQUEST: "visitRequests",
};

/**
 * Records an interaction. Fire-and-forget from the caller's perspective: page
 * views must never fail because analytics bookkeeping hiccuped.
 */
export async function recordPublicEvent(
  token: string,
  type: PublicListingEventType,
) {
  try {
    const link = await db.propertyPublicLink.findFirst({
      where: { token, isActive: true },
      select: { id: true },
    });
    if (!link) return false;
    await db.publicListingEvent.create({ data: { linkId: link.id, type } });
    const counter = COUNTER[type];
    if (counter)
      await db.propertyPublicLink.update({
        where: { id: link.id },
        data: {
          [counter]: { increment: 1 },
          ...(type === "VIEW" ? { lastViewedAt: new Date() } : {}),
        },
      });
    return true;
  } catch {
    return false;
  }
}

export async function listAdCopies(propertyId: string) {
  return db.propertyAdCopy.findMany({
    where: { propertyId },
    select: { id: true, variant: true, content: true, generator: true, editedByUser: true, updatedAt: true },
  });
}

export async function saveAdCopy(
  propertyId: string,
  variant: AdCopyVariant,
  content: string,
  user: CurrentUser,
  generator: string,
  editedByUser: boolean,
) {
  const allowed = await db.property.findFirst({
    where: { id: propertyId, deletedAt: null, AND: [propertyCanEditWhere(user)] },
    select: { id: true },
  });
  if (!allowed) return { error: "این فایل برای شما در دسترس نیست." };
  await db.propertyAdCopy.upsert({
    where: { propertyId_variant: { propertyId, variant } },
    update: { content, generator, editedByUser },
    create: { propertyId, variant, content, generator, editedByUser, createdByUserId: user.id },
  });
  return { success: "متن آگهی ذخیره شد." };
}

/** Visibility rules for the anonymous page: never soft-deleted, never access-blocked. */
export const PUBLICLY_VISIBLE: Prisma.PropertyWhereInput = {
  deletedAt: null,
  accessBlockedAt: null,
};
