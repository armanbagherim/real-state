import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";
import { extensionOptions, extensionResponse } from "@/lib/extension-api";
import { normalizeDigits } from "@/lib/utils";

const inputSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export function OPTIONS(request: NextRequest) {
  return extensionOptions(request);
}

export async function POST(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return extensionResponse(request, { error: "شماره موبایل و رمز عبور را وارد کنید." }, { status: 400 });
  const username = parsed.data.username.toLowerCase();
  const mobile = normalizeDigits(parsed.data.username).replace(/\D/g, "");
  const key = createHash("sha256").update(username).digest("hex");
  await db.loginAttempt.upsert({
    where: { key },
    create: { key, count: 0, resetAt: new Date(Date.now() + 900000) },
    update: {},
  });
  await db.loginAttempt.updateMany({
    where: { key, resetAt: { lt: new Date() } },
    data: { count: 0, resetAt: new Date(Date.now() + 900000) },
  });
  const attempt = await db.loginAttempt.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  if (attempt.count > 10)
    return extensionResponse(request, { error: "تلاش‌های ورود بیش از حد مجاز است." }, { status: 429 });
  const user = await db.user.findFirst({
    where: { OR: [{ username }, ...(mobile ? [{ mobile }] : [])] },
  });
  const valid = await compare(parsed.data.password, user?.passwordHash ?? "invalid");
  if (!user || !valid)
    return extensionResponse(request, { error: "شماره موبایل یا رمز عبور نادرست است." }, { status: 401 });
  if (user.status !== "APPROVED")
    return extensionResponse(request, { error: "حساب شما هنوز تأیید نشده است." }, { status: 403 });
  await db.loginAttempt.delete({ where: { key } });
  const session = await createSessionToken(user.id);
  return extensionResponse(request, {
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    user: { id: user.id, name: user.name, role: user.role, officeId: user.officeId },
  });
}
