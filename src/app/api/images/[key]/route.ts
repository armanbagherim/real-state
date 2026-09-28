import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { storage } from "@/services/storage";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  if (!(await getUser())) return new NextResponse(null, { status: 401 });
  try {
    const data = await storage.read((await params).key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
