import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { propertyWhere } from "@/repositories/properties";
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json([]);
  return NextResponse.json(
    await db.property.findMany({
      where: propertyWhere({ q }, user),
      select: {
        id: true,
        title: true,
        fileCode: true,
        owner: { select: { fullName: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    { headers: { "Cache-Control": "no-store" } },
  );
}
