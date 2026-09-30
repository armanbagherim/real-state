import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const packages = await db.package.findMany({
    where: { active: true, internal: false },
    select: {
      name: true,
      description: true,
      monthlyPrice: true,
      yearlyPrice: true,
      propertyLimit: true,
      agentLimit: true,
      badge: true,
      color: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { monthlyPrice: "asc" }],
  });
  return NextResponse.json(packages, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
