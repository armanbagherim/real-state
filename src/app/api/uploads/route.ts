import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage } from "@/services/storage";
import { propertyCanUploadImageWhere } from "@/lib/access";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
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
  if (Number(request.headers.get("content-length") ?? 0) > 9 * 1024 * 1024)
    return NextResponse.json(
      { error: "حجم فایل بیش از حد مجاز است" },
      { status: 413 },
    );
  try {
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json({ error: "فایلی دریافت نشد" }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 9 * 1024 * 1024) {
        await reader.cancel();
        return NextResponse.json(
          { error: "حجم فایل بیش از حد مجاز است" },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    const file = form.get("file");
    const propertyId = String(form.get("propertyId"));
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "تصویر JPG، PNG یا WebP تا ۸ مگابایت انتخاب کنید" },
        { status: 400 },
      );
    const image = await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id=${propertyId} FOR UPDATE`;
        await tx.property.findFirstOrThrow({
          where: {
            id: propertyId,
            deletedAt: null,
            AND: [propertyCanUploadImageWhere(user)],
          },
        });
        const count = await tx.propertyImage.count({ where: { propertyId } });
        if (count >= 20) throw new Error("Image limit");
        const url = await storage.save(Buffer.from(await file.arrayBuffer()));
        return tx.propertyImage.create({
          data: { propertyId, url, sortOrder: count },
        });
      },
      { timeout: 15000 },
    );
    return NextResponse.json({ id: image.id, url: image.url });
  } catch {
    return NextResponse.json(
      { error: "بارگذاری انجام نشد؛ فایل، اتصال و سقف ۲۰ تصویر را بررسی کنید" },
      { status: 400 },
    );
  }
}
