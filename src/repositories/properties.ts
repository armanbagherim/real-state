import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeDigits } from "@/lib/utils";
import { propertyAccessWhere, type CurrentUser } from "@/lib/access";
export type SearchParams = Record<string, string | string[] | undefined>;
export const str = (s: SearchParams, k: string) =>
  typeof s[k] === "string" ? (s[k] as string) : "";
export function propertyWhere(
  s: SearchParams,
  user?: CurrentUser,
): Prisma.PropertyWhereInput {
  const q = normalizeDigits(str(s, "q")).slice(0, 200);
  const where: Prisma.PropertyWhereInput = user
    ? { deletedAt: null, AND: [propertyAccessWhere(user)] }
    : { deletedAt: null };
  if (q)
    where.OR = [
      ...["title", "fileCode", "neighborhood", "address"].map((k) => ({
        [k]: { contains: q, mode: "insensitive" },
      })),
      {
        owner: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { mobile: { contains: q } },
          ],
        },
      },
    ];
  if (["RENT", "SALE"].includes(str(s, "transactionType")))
    where.transactionType = str(s, "transactionType") as "RENT" | "SALE";
  if (
    ["ACTIVE", "RENTED", "SOLD", "INACTIVE", "ARCHIVED"].includes(
      str(s, "status"),
    )
  )
    where.status = str(s, "status") as Prisma.EnumPropertyStatusFilter;
  for (const key of [
    "city",
    "district",
    "neighborhood",
    "propertyType",
    "ownerId",
  ] as const)
    if (str(s, key))
      where[key] = key === "ownerId" ? str(s, key) : { contains: str(s, key) };
  for (const key of ["parking", "elevator", "isConvertible"] as const)
    if (str(s, key) === "true") where[key] = true;
  for (const key of ["bedrooms", "floor"] as const) {
    const val = str(s, key);
    if (val && Number.isFinite(Number(val))) where[key] = Number(val);
  }
  for (const [field, min, max] of [
    ["area", "minArea", "maxArea"],
    ["salePrice", "minPrice", "maxPrice"],
    ["mortgagePrice", "minMortgage", "maxMortgage"],
    ["rentPrice", "minRent", "maxRent"],
  ] as const) {
    const a = str(s, min),
      b = str(s, max);
    if (a || b)
      where[field] = {
        ...(a && Number.isFinite(Number(a)) ? { gte: Number(a) } : {}),
        ...(b && Number.isFinite(Number(b)) ? { lte: Number(b) } : {}),
      };
  }
  return where;
}
export async function listProperties(s: SearchParams, user?: CurrentUser) {
  const page = Math.min(100000, Math.max(1, parseInt(str(s, "page")) || 1));
  const where = propertyWhere(s, user);
  const sort = str(s, "sort");
  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sort === "price"
      ? { salePrice: "asc" }
      : sort === "area"
      ? { area: "desc" }
      : { createdAt: "desc" };
  const [items, total] = await Promise.all([
    db.property.findMany({
      where,
      include: {
        owner: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy,
      skip: (page - 1) * 12,
      take: 12,
    }),
    db.property.count({ where }),
  ]);
  return { items, total, page, pages: Math.ceil(total / 12) };
}
