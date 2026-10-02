import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storage } from "@/services/storage";
export const runtime = "nodejs";
const KEY = /^([a-f0-9-]{36})\.webp$/;

/**
 * Anonymous reads are authorised once per key and memoised briefly, so a
 * 20-image gallery costs one query instead of twenty and a slow database
 * cannot turn every image request into a 500.
 */
const PUBLIC_GRANT_TTL = 60_000;
const grants = new Map<string, number>();
const MAX_GRANTS = 500;

function rememberGrant(key: string) {
  const now = Date.now();
  if (grants.size >= MAX_GRANTS)
    for (const [k, at] of grants) if (now - at > PUBLIC_GRANT_TTL) grants.delete(k);
  grants.set(key, now);
}

async function isPubliclyVisible(key: string) {
  const at = grants.get(key);
  if (at && Date.now() - at < PUBLIC_GRANT_TTL) return true;
  const image = await db.propertyImage.findFirst({
    where: { url: { endsWith: key } },
    select: {
      property: {
        select: {
          publicLink: {
            select: {
              isActive: true,
              property: { select: { deletedAt: true, accessBlockedAt: true } },
            },
          },
        },
      },
    },
  });
  const listing = image?.property.publicLink;
  const visible =
    listing?.isActive === true &&
    !listing.property.deletedAt &&
    !listing.property.accessBlockedAt;
  if (visible) rememberGrant(key);
  return visible;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const key = (await params).key;
  if (!KEY.test(key)) return new NextResponse(null, { status: 401 });
  const user = await getUser();
  if (!user) {
    // A public listing is the only way in without a session.
    let visible = false;
    try {
      visible = await isPubliclyVisible(key);
    } catch {
      // Database trouble must not leak images; it must not 500 the page either.
      return new NextResponse(null, { status: 401 });
    }
    if (!visible) return new NextResponse(null, { status: 401 });
  }
  try {
    const data = await storage.read(key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": user
          ? "private, no-store"
          : "public, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}