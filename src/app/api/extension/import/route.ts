import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { extensionOptions, extensionResponse } from "@/lib/extension-api";
import { normalizeDigits, propertyTypes } from "@/lib/utils";
import { saveProperty } from "@/services/properties";
import { canCreateProperty } from "@/repositories/billing";
import { storage } from "@/services/storage";

const importSchema = z.object({
  title: z.string().trim().min(3).max(200),
  transactionType: z.enum(["SALE", "RENT"]),
  propertyType: z.string().trim().max(100).default("سایر"),
  city: z.string().trim().max(100).default("تهران"),
  district: z.string().trim().max(100).default(""),
  neighborhood: z.string().trim().min(1).max(100),
  address: z.string().trim().max(1000).default("آدرس از آگهی دریافت نشد"),
  area: z.number().finite().positive().max(1e7),
  bedrooms: z.number().int().min(0).max(100).default(0),
  floor: z.number().int().min(-10).max(200).default(0),
  buildingAge: z.number().int().min(0).max(300).default(0),
  salePrice: z.number().finite().min(0).max(1e15).default(0),
  mortgagePrice: z.number().finite().min(0).max(1e15).default(0),
  rentPrice: z.number().finite().min(0).max(1e15).default(0),
  isConvertible: z.boolean().default(false),
  parking: z.boolean().default(false),
  storage: z.boolean().default(false),
  elevator: z.boolean().default(false),
  balcony: z.boolean().default(false),
  description: z.string().max(10000).default(""),
  ownerName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  source: z.enum(["amlakplus", "divar", "kashano"]),
  sourceUrl: z.string().url().max(2000),
  images: z.array(z.string().url().max(2000)).max(30).default([]),
  /** Filing destination: existing folder id, or a name to auto-create. */
  folderId: z.string().trim().max(64).optional(),
  folderName: z.string().trim().max(80).optional(),
});

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  return extensionOptions(request);
}

function phoneValue(value?: string | null) {
  const normalized = normalizeDigits(value ?? "").replace(/\D/g, "");
  return /^0\d{9,10}$/.test(normalized) ? normalized : null;
}

function allowedImageUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      (["https:", "http:"].includes(url.protocol) &&
        url.hostname === "dl.amlakplus.app") ||
      url.hostname.endsWith(".amlakplus.app") ||
      url.hostname === "divarcdn.com" ||
      url.hostname.endsWith(".divarcdn.com") ||
      url.hostname === "pics.kashano.ir"
    );
  } catch {
    return false;
  }
}

async function saveRemoteImage(url: string) {
  if (!allowedImageUrl(url)) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) return null;
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > 8 * 1024 * 1024) return null;
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > 8 * 1024 * 1024) return null;
  return storage.save(data);
}

/**
 * Returns the folder the import should be filed into, or null to leave the
 * property unfiled. An unknown `folderId` is ignored; `folderName` creates the
 * folder when missing. Folder scope always follows the importing user's office.
 */
async function resolveFolder(
  user: NonNullable<Awaited<ReturnType<typeof getUser>>>,
  input: { folderId?: string; folderName?: string },
): Promise<string | null> {
  const scope = { officeId: user.officeId ?? "__none__" };
  if (input.folderId) {
    const existing = await db.filingFolder.findFirst({
      where: { id: input.folderId, ...scope },
      select: { id: true },
    });
    if (existing) return existing.id;
  }
  const name = input.folderName?.trim();
  if (!name) return null;
  const existing = await db.filingFolder.findFirst({
    where: { ...scope, parentId: null, name },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await db.filingFolder.create({
    data: {
      name,
      officeId: user.officeId,
      createdByUserId: user.id,
    },
    select: { id: true },
  });
  return created.id;
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user)
    return extensionResponse(
      request,
      { error: "احراز هویت منقضی شده است." },
      { status: 401 },
    );
  const parsed = importSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return extensionResponse(
      request,
      { error: "اطلاعات ملک ناقص یا نامعتبر است." },
      { status: 400 },
    );
  const input = parsed.data;
  const duplicate = await db.property.findFirst({
    where: { source: input.source, sourceUrl: input.sourceUrl },
    select: { id: true, fileCode: true, title: true, deletedAt: true },
  });
  if (duplicate && !duplicate.deletedAt)
    return extensionResponse(
      request,
      { duplicate: true, property: duplicate },
      { status: 409 },
    );

  const quota = await canCreateProperty(user);
  if (quota.blocked)
    return extensionResponse(request, { error: quota.reason }, { status: 402 });

  // Resolve the filing destination before creating anything, so a bad folder
  // reference never leaves a half-imported property behind.
  const folderId = await resolveFolder(user, input);

  const phone = phoneValue(input.phone);
  const owner = phone
    ? await db.owner.findFirst({
        where: { officeId: user.officeId, mobile: phone },
      })
    : null;
  const savedOwner =
    owner ??
    (await db.owner.create({
      data: {
        officeId: user.officeId,
        createdByUserId: user.id,
        fullName: input.ownerName || `مالک آگهی ${input.title}`,
        mobile: phone ?? "09000000000",
        description:
          "مالک از منبع خارجی وارد شده است؛ اطلاعات تماس در فایل نگهداری می‌شود.",
      },
    }));
  try {
    if (duplicate?.deletedAt)
      await db.property.update({
        where: { id: duplicate.id },
        data: { deletedAt: null },
      });
    const property = await saveProperty(
      {
        title: input.title,
        ownerId: savedOwner.id,
        transactionType: input.transactionType,
        propertyType: propertyTypes.includes(input.propertyType)
          ? input.propertyType
          : "سایر",
        status: "ACTIVE",
        city: input.city || "تهران",
        district: input.district,
        neighborhood: input.neighborhood,
        address: input.address || "آدرس از آگهی دریافت نشد",
        area: input.area,
        bedrooms: input.bedrooms,
        floor: input.floor,
        totalFloors: 1,
        unitsPerFloor: 1,
        buildingAge: input.buildingAge,
        parking: input.parking,
        storage: input.storage,
        elevator: input.elevator,
        balcony: input.balcony,
        salePrice: input.salePrice,
        mortgagePrice: input.mortgagePrice,
        rentPrice: input.rentPrice,
        isConvertible: input.isConvertible,
        description: input.description,
        internalNotes: `منبع: ${input.source}\n${input.sourceUrl}`,
      },
      user,
      duplicate?.deletedAt ? duplicate.id : undefined,
      { source: input.source, sourceUrl: input.sourceUrl, contactPhone: phone },
    );
    if (folderId)
      await db.property.update({
        where: { id: property.id },
        data: { folderId },
      });
    if (duplicate?.deletedAt)
      await db.propertyImage.deleteMany({ where: { propertyId: property.id } });
    const saved = await Promise.all(
      [...new Set(input.images)]
        .slice(0, 20)
        .map((image) => saveRemoteImage(image).catch(() => null)),
    );
    const imageUrls = saved.filter((url): url is string => Boolean(url));
    if (imageUrls.length)
      await db.propertyImage.createMany({
        data: imageUrls.map((url, sortOrder) => ({
          propertyId: property.id,
          url,
          sortOrder,
        })),
      });
    return extensionResponse(request, {
      imported: true,
      property: {
        id: property.id,
        fileCode: property.fileCode,
        title: property.title,
      },
      imagesImported: imageUrls.length,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.property.findFirst({
        where: { source: input.source, sourceUrl: input.sourceUrl },
        select: { id: true, fileCode: true, title: true, deletedAt: true },
      });
      return extensionResponse(
        request,
        { duplicate: true, property: existing },
        { status: 409 },
      );
    }
    return extensionResponse(
      request,
      { error: "ثبت ملک در آشیان انجام نشد." },
      { status: 400 },
    );
  }
}
