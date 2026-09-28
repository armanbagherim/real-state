"use server";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, clearSession } from "@/lib/auth";
import { z } from "zod";

const dummyHash = hash(randomBytes(32).toString("hex"), 12);

const normalizeMobile = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");

const strongPassword = z
  .string()
  .min(10, "رمز عبور حداقل ۱۰ کاراکتر باشد.")
  .max(72, "رمز عبور بیش از حد طولانی است.")
  .regex(/[A-Za-z]/, "رمز عبور باید حداقل یک حرف انگلیسی داشته باشد.")
  .regex(/[0-9]/, "رمز عبور باید حداقل یک عدد داشته باشد.")
  .regex(/[^A-Za-z0-9]/, "رمز عبور باید حداقل یک نشانه مثل @ یا # داشته باشد.");
const formValues = (form: FormData) =>
  Object.fromEntries(
    Array.from(form.entries())
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, String(value)]),
  );
export type RegisterState = {
  error: string;
  success: string;
  fields: Record<string, string[]>;
  values: Record<string, string>;
};

export async function login(_previous: { error: string }, form: FormData) {
  const input = z
    .object({
      username: z.string().trim().min(1).max(100),
      password: z.string().min(1).max(200),
    })
    .safeParse(Object.fromEntries(form));
  if (!input.success)
    return { error: "شماره موبایل یا نام کاربری و رمز عبور را وارد کنید." };

  const username = input.data.username.toLowerCase();
  const mobile = normalizeMobile(input.data.username);
  const key = createHash("sha256").update(username).digest("hex");
  try {
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
      return {
        error: "تلاش‌های ورود بیش از حد مجاز است. ۱۵ دقیقه دیگر تلاش کنید.",
      };
    const user = await db.user.findFirst({
      where: { OR: [{ username }, ...(mobile ? [{ mobile }] : [])] },
    });
    const valid = await compare(
      input.data.password,
      user?.passwordHash ?? (await dummyHash),
    );
    if (!user || !valid)
      return { error: "شماره موبایل/نام کاربری یا رمز عبور نادرست است." };
    if (user.status !== "APPROVED")
      return { error: "حساب شما هنوز توسط مدیر تأیید نشده است." };
    await db.loginAttempt.delete({ where: { key } });
    await createSession(user.id);
  } catch {
    return { error: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید." };
  }
  redirect("/dashboard");
}

export async function register(
  _previous: RegisterState,
  form: FormData,
): Promise<RegisterState> {
  const values = formValues(form);
  const parsed = z
    .object({
      name: z.string().trim().min(2, "نام را کامل وارد کنید.").max(100),
      mobile: z
        .string()
        .transform(normalizeMobile)
        .refine((v) => /^09\d{9}$/.test(v), "شماره موبایل معتبر وارد کنید."),
      officeName: z.string().trim().min(2, "نام املاک را وارد کنید.").max(120),
      officePhone: z.string().trim().max(50).optional(),
      officeAddress: z.string().trim().max(300).optional(),
      password: strongPassword,
      confirmPassword: z.string(),
    })
    .refine((v) => v.password === v.confirmPassword, {
      path: ["confirmPassword"],
      message: "تکرار رمز عبور با رمز اصلی یکسان نیست.",
    })
    .safeParse(Object.fromEntries(form));

  if (!parsed.success)
    return {
      error: "لطفاً خطاهای فرم ثبت‌نام را بررسی کنید.",
      success: "",
      fields: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
      values,
    };

  const data = parsed.data;
  try {
    const passwordHash = await hash(data.password, 12);
    await db.$transaction(async (tx) => {
      const office = await tx.office.create({
        data: {
          name: data.officeName,
          phone: data.officePhone ?? "",
          address: data.officeAddress ?? "",
        },
      });
      const user = await tx.user.create({
        data: {
          name: data.name,
          username: data.mobile,
          mobile: data.mobile,
          passwordHash,
          role: "OFFICE_ADMIN",
          status: "PENDING",
          officeId: office.id,
        },
      });
      await tx.userApproval.create({
        data: { userId: user.id, status: "PENDING", note: "ثبت‌نام اولیه" },
      });
    });
  } catch {
    return {
      error: "این شماره موبایل قبلاً ثبت شده یا ثبت‌نام انجام نشد.",
      success: "",
      fields: {},
      values,
    };
  }
  return {
    error: "",
    success: "ثبت‌نام انجام شد. بعد از تأیید مدیر کل می‌توانید وارد شوید.",
    fields: {},
    values: {},
  };
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
