import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes } from "node:crypto";
import { createHmac, randomBytes } from "node:crypto";
import { db } from "./db";
const COOKIE = "ashian-session";
function digest(token: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Session secret is not configured");
  return createHmac("sha256", secret).update(token).digest("hex");
}
export const getUser = async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: digest(token) },
    include: { user: { include: { office: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.status !== "APPROVED") redirect("/login");
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db.session.create({ data: { id: digest(token), userId, expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: digest(token) } });
  jar.delete(COOKIE);
}
