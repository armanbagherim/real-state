import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage } from "@/services/storage";
import { propertyCanDeleteImageWhere } from "@/lib/access";
export const runtime = "nodejs";
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user)
    return NextResponse.json(
      { error: "ورود به حساب لازم است" },
      { status: 401 },
    );
  if (
    request.headers.get("origin") !==
    new URL(process.env.NEXTAUTH_URL ?? request.url).origin
  )
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 403 });
  try {
    const image = await db.propertyImage.findFirst({
      where: {
        id: (await params).id,
        property: { deletedAt: null, AND: [propertyCanDeleteImageWhere(user)] },
      },
      select: { id: true, url: true },
    });
    if (!image)
      return NextResponse.json({ error: "تصویر یافت نشد" }, { status: 404 });
    await db.propertyImage.delete({ where: { id: image.id } });
    try {
      await storage.remove(image.url.split("/").pop()!);
    } catch {}
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "حذف تصویر انجام نشد؛ دوباره تلاش کنید" },
      { status: 400 },
    );
  }
}
