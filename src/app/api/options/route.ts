import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeDigits } from "@/lib/utils";
import {
  ownerAccessWhere,
  propertyAccessWhere,
  propertyCanEditWhere,
} from "@/lib/access";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kind = request.nextUrl.searchParams.get("kind");
  const q = normalizeDigits(request.nextUrl.searchParams.get("q") ?? "").slice(
    0,
    150,
  );
  const id = request.nextUrl.searchParams.get("id");
  if (kind === "owners") {
    const rows = await db.owner.findMany({
      where: id
        ? { id, AND: [ownerAccessWhere(user)] }
        : {
            AND: [
              ownerAccessWhere(user),
              { OR: [{ fullName: { contains: q } }, { mobile: { contains: q } }] },
            ],
          },
      select: { id: true, fullName: true, mobile: true },
      take: 20,
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(
      rows.map((o) => ({ value: o.id, label: `${o.fullName} · ${o.mobile}` })),
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  if (kind === "properties" || kind === "rent-properties") {
    const access =
      kind === "rent-properties" ? propertyCanEditWhere(user) : propertyAccessWhere(user);
    const rows = await db.property.findMany({
      where: {
        deletedAt: null,
        ...(kind === "rent-properties" ? { transactionType: "RENT" as const } : {}),
        AND: [access],
        ...(id
          ? { id }
          : {
              OR: [
                { fileCode: { contains: q, mode: "insensitive" as const } },
                { title: { contains: q } },
                { owner: { fullName: { contains: q } } },
              ],
            }),
      },
      select: { id: true, fileCode: true, title: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      rows.map((p) => ({ value: p.id, label: `${p.fileCode} · ${p.title}` })),
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json([], { status: 400 });
}
