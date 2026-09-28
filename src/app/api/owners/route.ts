import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ownerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = ownerSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: "اطلاعات مالک را کامل وارد کنید." },
      { status: 400 },
    );
  const owner = await db.owner.create({
    data: {
      ...parsed.data,
      officeId: user.officeId,
      createdByUserId: user.id,
    },
    select: { id: true, fullName: true, mobile: true },
  });
  return NextResponse.json({
    value: owner.id,
    label: `${owner.fullName} · ${owner.mobile}`,
  });
}
