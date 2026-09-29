export const CARD_NUMBER = "6104337424895755";

export type QuotaInput = {
  officeId: string | null;
  used: number;
  hasSubscriptionHistory: boolean;
  active: { propertyLimit: number; endsAt: Date | null } | null;
};

export type Quota = {
  blocked: boolean;
  reason: string;
  limit: number;
  used: number;
  remaining: number;
  hasActive: boolean;
};

export function quotaFor(input: QuotaInput): Quota {
  const { officeId, used, hasSubscriptionHistory, active } = input;
  const free: Quota = {
    blocked: false,
    reason: "",
    limit: 0,
    used,
    remaining: Number.POSITIVE_INFINITY,
    hasActive: false,
  };
  if (!officeId) return free;
  if (!hasSubscriptionHistory) return free;
  if (!active)
    return {
      blocked: true,
      reason: "اشتراک دفتر شما فعال نیست. برای ثبت فایل جدید ابتدا اشتراک تهیه کنید.",
      limit: 0,
      used,
      remaining: 0,
      hasActive: false,
    };
  const remaining = Math.max(0, active.propertyLimit - used);
  if (used >= active.propertyLimit)
    return {
      blocked: true,
      reason: `سقف فایل اشتراک شما (${active.propertyLimit} فایل) تکمیل شده است.`,
      limit: active.propertyLimit,
      used,
      remaining: 0,
      hasActive: true,
    };
  return {
    blocked: false,
    reason: "",
    limit: active.propertyLimit,
    used,
    remaining,
    hasActive: true,
  };
}

export type Split = { userId: string; percent: number };

export type CommissionResult = {
  ok: boolean;
  error: string;
  entries: { userId: string; percent: number; amount: number }[];
  total: number;
};

export function computeCommission(
  amount: number,
  splits: Split[],
): CommissionResult {
  const fail = (error: string): CommissionResult => ({
    ok: false,
    error,
    entries: [],
    total: 0,
  });
  if (!splits.length) return fail("حداقل یک نفر برای تقسیم کمیسیون لازم است.");
  const seen = new Set<string>();
  for (const s of splits) {
    if (!s.userId) return fail("یکی از افراد انتخاب نشده است.");
    if (seen.has(s.userId)) return fail("یک شخص نباید دوبار انتخاب شود.");
    seen.add(s.userId);
    if (!Number.isInteger(s.percent) || s.percent <= 0 || s.percent > 100)
      return fail("درصد کمیسیون باید عددی بین ۱ تا ۱۰۰ باشد.");
  }
  const sum = splits.reduce((acc, s) => acc + s.percent, 0);
  if (sum !== 100)
    return fail(`مجموع درصدها باید ۱۰۰ شود (اکنون ${sum} است).`);
  const sorted = [...splits].sort((a, b) => b.percent - a.percent);
  const entries = splits.map((s) => ({
    userId: s.userId,
    percent: s.percent,
    amount: Math.floor((amount * s.percent) / 100),
  }));
  const top = entries.find((e) => e.userId === sorted[0].userId)!;
  const total = entries.reduce((acc, e) => acc + e.amount, 0);
  top.amount += amount - total;
  return { ok: true, error: "", entries, total: amount };
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function makeReferralCode(
  random: (n: number) => Uint8Array,
): string {
  const bytes = random(8);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function referralOwnerLabel(
  code: { user: { name: string } | null; property: { title: string } | null } | null,
) {
  if (!code) return null;
  if (code.user) return `کاربر ${code.user.name}`;
  if (code.property) return `فایل ${code.property.title}`;
  return null;
}
