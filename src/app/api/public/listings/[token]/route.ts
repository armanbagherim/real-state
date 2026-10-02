import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getActivePublicListing,
  recordPublicEvent,
} from "@/repositories/public-listings";
import { normalizeDigits } from "@/lib/utils";

export const runtime = "nodejs";

const body = z.object({
  type: z.enum(["VIEW", "GALLERY", "PHONE_CLICK"]),
});

/** Fire-and-forget beacon from the public page. Never blocks the visitor. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const parsed = body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const link = await getActivePublicListing(token);
  if (!link) return NextResponse.json({ ok: false }, { status: 404 });
  const ok = await recordPublicEvent(token, parsed.data.type);
  return NextResponse.json({ ok });
}

const requestSchema = z.object({
  name: z.string().trim().min(2, "نام خود را بنویسید.").max(80),
  mobile: z
    .string()
    .trim()
    .min(10, "شماره موبایل معتبر نیست.")
    .max(20)
    .transform((value) => normalizeDigits(value).replace(/\D/g, ""))
    .refine((value) => /^09\d{9}$/.test(value), "شماره موبایل معتبر نیست."),
  note: z.string().trim().max(500).default(""),
  /** Honeypot: real users never fill this hidden field. */
  website: z.string().max(0).optional(),
});

/**
 * Public visit request. Lands in the existing CRM as a FollowUp on the property
 * so it shows up in the agent's normal follow-up list — no parallel lead system.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const link = await getActivePublicListing(token);
  if (!link)
    return NextResponse.json(
      { error: "این آگهی در دسترس نیست." },
      { status: 404 },
    );
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است." },
      { status: 400 },
    );
  if (parsed.data.website)
    return NextResponse.json({ ok: true });

  const property = link.property;
  // The agent who owns the file is who should answer the customer.
  const agentId = property.ownerUserId;
  if (!agentId)
    return NextResponse.json(
      { error: "برای این ملک مشاوری ثبت نشده است." },
      { status: 409 },
    );

  const when = new Date();
  const note = [
    `درخواست بازدید از صفحه عمومی`,
    `مشتری: ${parsed.data.name}`,
    `موبایل: ${parsed.data.mobile}`,
    parsed.data.note ? `توضیح: ${parsed.data.note}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await db.$transaction([
    db.followUp.create({
      data: {
        propertyId: property.id,
        ownerId: property.ownerId,
        userId: agentId,
        type: "OTHER",
        status: "PENDING",
        note,
        // Due today: the customer asked to be contacted now.
        followUpDate: when,
      },
    }),
    db.property.update({
      where: { id: property.id },
      data: { lastFollowUpAt: when },
    }),
  ]);
  await recordPublicEvent(token, "VISIT_REQUEST");
  return NextResponse.json({ ok: true });
}
