import { test } from "node:test";
import assert from "node:assert/strict";
import { reminderDates } from "../src/services/contracts";
import {
  contractSchema,
  propertySchema,
  settingsSchema,
} from "../src/lib/validation";
import {
  tehranDayRange,
  normalizeDigits,
  wrapIndex,
  propertyShareText,
} from "../src/lib/utils";
import {
  computeCommission,
  discountPercent,
  makeReferralCode,
  periodEnd,
  periodLabel,
  priceFor,
  quotaFor,
} from "../src/lib/billing";
import { propertyWhere } from "../src/repositories/properties";
import {
  canDeletePropertyImages,
  propertyCanDeleteImageWhere,
  type CurrentUser,
} from "../src/lib/access";
test("contract reminders preserve exact offsets across month and year boundaries", () => {
  const end = new Date("2027-01-05T08:30:00Z");
  const dates = reminderDates(end, [60, 30, 14, 7]);
  assert.equal(dates[1].toISOString(), "2026-12-06T08:30:00.000Z");
  assert.equal(dates[3].toISOString(), "2026-12-29T08:30:00.000Z");
});
test("contract rejects reverse dates and accepts Persian mobile digits", () => {
  const input = {
    propertyId: "id",
    tenantName: "مستأجر",
    tenantMobile: "۰۹۱۲۱۲۳۴۵۶۷",
    startDate: "2026-10-01",
    endDate: "2026-09-01",
    mortgageAmount: 1000,
    rentAmount: 100,
    description: "",
    previousContractId: "",
  };
  assert.equal(contractSchema.safeParse(input).success, false);
  const parsed = contractSchema.parse({ ...input, endDate: "2027-10-01" });
  assert.equal(parsed.tenantMobile, "09121234567");
});
test("money remains bounded and invalid transaction status is rejected", () => {
  const valid = {
    title: "ملک آزمایشی",
    ownerId: "owner",
    transactionType: "SALE",
    propertyType: "آپارتمان",
    status: "ACTIVE",
    city: "تهران",
    district: "",
    neighborhood: "محله",
    address: "آدرس آزمایشی",
    area: 100,
    bedrooms: 2,
    floor: 1,
    totalFloors: 4,
    unitsPerFloor: 2,
    buildingAge: 3,
    parking: true,
    storage: false,
    elevator: true,
    balcony: false,
    salePrice: 1000000000,
    mortgagePrice: 0,
    rentPrice: 0,
    isConvertible: false,
    description: "",
    internalNotes: "",
  };
  assert.equal(propertySchema.safeParse(valid).success, true);
  for (const price of [-1, Infinity, 1e16])
    assert.equal(
      propertySchema.safeParse({ ...valid, salePrice: price }).success,
      false,
    );
  assert.equal(
    propertySchema.safeParse({ ...valid, status: "RENTED" }).success,
    false,
  );
  assert.equal(
    propertySchema.safeParse({
      ...valid,
      transactionType: "RENT",
      status: "SOLD",
    }).success,
    false,
  );
});
test("reminder settings reject duplicates and invalid offsets", () => {
  const base = {
    officeName: "آشیان",
    officePhone: "",
    officeAddress: "",
    conversionRate: 0.03,
  };
  assert.deepEqual(
    settingsSchema.parse({ ...base, reminderDays: "۶۰،۳۰،۱۴،۷" }).reminderDays,
    [60, 30, 14, 7],
  );
  assert.equal(
    settingsSchema.safeParse({ ...base, reminderDays: "30,30" }).success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ ...base, reminderDays: "0,400" }).success,
    false,
  );
});
test("today uses Tehran midnight rather than server UTC midnight", () => {
  const { start, end } = tehranDayRange(new Date("2026-09-27T22:00:00Z"));
  assert.equal(start.toISOString(), "2026-09-27T20:30:00.000Z");
  assert.equal(end.getTime() - start.getTime(), 86400000);
});
test("filters exclude deleted properties and bind search text", () => {
  const where = propertyWhere({
    q: "' OR 1=1 --",
    transactionType: "RENT",
    minArea: "100",
    maxArea: "150",
    parking: "true",
  });
  assert.equal(where.deletedAt, null);
  assert.equal(where.transactionType, "RENT");
  assert.deepEqual(where.area, { gte: 100, lte: 150 });
  assert.equal(where.parking, true);
  assert.equal(where.OR?.length, 5);
  assert.equal(normalizeDigits("A-۱۰۰۱"), "A-1001");
});
test("gallery index wraps around in both directions", () => {
  assert.equal(wrapIndex(2, 1, 3), 0);
  assert.equal(wrapIndex(0, -1, 3), 2);
  assert.equal(wrapIndex(1, 1, 3), 2);
});
test("image deletion is limited to the file creator and super admin", () => {
  const agent: CurrentUser = {
    id: "u1",
    role: "AGENT",
    status: "APPROVED",
    officeId: "o1",
  };
  const superAdmin: CurrentUser = { ...agent, role: "SUPER_ADMIN" };
  const own = { ownerUserId: "u1" };
  const other = { ownerUserId: "u2" };
  const orphan = { ownerUserId: null };
  assert.equal(canDeletePropertyImages(agent, own), true);
  assert.equal(canDeletePropertyImages(agent, other), false);
  assert.equal(canDeletePropertyImages(agent, orphan), false);
  assert.equal(canDeletePropertyImages(superAdmin, other), true);
  assert.equal(canDeletePropertyImages(superAdmin, orphan), true);
  assert.deepEqual(propertyCanDeleteImageWhere(superAdmin), {});
  assert.deepEqual(propertyCanDeleteImageWhere(agent), { ownerUserId: "u1" });
});
test("share text summarises a property with the right price basis", () => {
  const base = {
    title: "آپارتمان لوکس",
    fileCode: "A-1001",
    propertyType: "آپارتمان",
    area: "120.5",
    bedrooms: 3,
    city: "تهران",
    district: "منطقه ۱",
    neighborhood: "فرمانیه",
  };
  const sale = propertyShareText({
    ...base,
    transactionType: "SALE",
    salePrice: 9000000000,
    mortgagePrice: 0,
    rentPrice: 0,
    imageUrl: "/api/images/a.webp",
  });
  assert.ok(sale.includes("فرمانیه"));
  assert.ok(sale.includes("کد فایل: A-1001"));
  assert.ok(sale.includes("۱۲۰٫۵ متر"));
  assert.ok(sale.includes("تومان"));
  assert.ok(sale.includes("/api/images/a.webp"));
  assert.ok(!sale.includes("رهن"), "sale price must not mention rent");
  const rent = propertyShareText({
    ...base,
    transactionType: "RENT",
    salePrice: 0,
    mortgagePrice: 500000000,
    rentPrice: 25000000,
  });
  assert.ok(rent.includes("رهن"));
  assert.ok(rent.includes("اجاره"));
  assert.ok(!rent.includes("a.webp"), "no blank image line when absent");
});
test("commission split must total 100 and never lose money to rounding", () => {
  const ok = computeCommission(4_000_000, [
    { userId: "a", percent: 50 },
    { userId: "b", percent: 20 },
    { userId: "c", percent: 30 },
  ]);
  assert.equal(ok.ok, true);
  assert.equal(
    ok.entries.reduce((acc, e) => acc + e.amount, 0),
    4_000_000,
    "amounts must sum to the sale total",
  );
  assert.deepEqual(
    ok.entries.map((e) => e.amount).sort((x, y) => y - x),
    [2_000_000, 1_200_000, 800_000],
  );
  const rounded = computeCommission(999_999, [
    { userId: "a", percent: 33 },
    { userId: "b", percent: 33 },
    { userId: "c", percent: 34 },
  ]);
  assert.equal(
    rounded.entries.reduce((acc, e) => acc + e.amount, 0),
    999_999,
    "indivisible totals still reconcile exactly",
  );
  assert.ok(!computeCommission(100, [{ userId: "a", percent: 50 }]).ok);
  assert.ok(
    !computeCommission(100, [
      { userId: "a", percent: 50 },
      { userId: "a", percent: 50 },
    ]).ok,
    "duplicate person rejected",
  );
  assert.ok(
    !computeCommission(100, [{ userId: "a", percent: 0 }]).ok,
    "zero percent rejected",
  );
});
test("office quota blocks anything without an active subscription", () => {
  const legacy = quotaFor({
    officeId: "o1",
    used: 99,
    hasSubscriptionHistory: false,
    active: null,
  });
  assert.equal(
    legacy.blocked,
    true,
    "a brand-new office with no subscription must be blocked",
  );
  assert.ok(legacy.reason.includes("اشتراک"));
  const expired = quotaFor({
    officeId: "o1",
    used: 3,
    hasSubscriptionHistory: true,
    active: null,
  });
  assert.equal(expired.blocked, true);
  assert.ok(expired.reason.includes("اشتراک"));
  const under = quotaFor({
    officeId: "o1",
    used: 3,
    hasSubscriptionHistory: true,
    active: { propertyLimit: 10, endsAt: new Date() },
  });
  assert.equal(under.blocked, false);
  assert.equal(under.remaining, 7);
  const full = quotaFor({
    officeId: "o1",
    used: 10,
    hasSubscriptionHistory: true,
    active: { propertyLimit: 10, endsAt: new Date() },
  });
  assert.equal(full.blocked, true);
  assert.equal(full.remaining, 0);
});
test("referral codes are 8 chars from an unambiguous alphabet", () => {
  const code = makeReferralCode(() => new Uint8Array(8).fill(0));
  assert.equal(code.length, 8);
  assert.ok(!/[01IO]/.test(code), "no characters that look alike");
});
test("pricing picks the right period and reports the true discount", () => {
  const pkg = { monthlyPrice: 249_000, yearlyPrice: 2_490_000 };
  assert.equal(priceFor(pkg, "MONTHLY"), 249_000);
  assert.equal(priceFor(pkg, "YEARLY"), 2_490_000);
  assert.equal(discountPercent(249_000, 2_490_000), 17);
  assert.equal(discountPercent(449_000, 3_990_000), 26);
  assert.equal(
    discountPercent(249_000, 249_000 * 12),
    0,
    "no discount when full",
  );
  assert.equal(discountPercent(249_000, 249_000 * 13), 0, "never negative");
  assert.equal(discountPercent(0, 100), 0, "guard against divide by zero");
  assert.equal(periodLabel("YEARLY"), "سالانه");
});
test("period end is calendar aware, not a fixed day count", () => {
  const jan31 = new Date("2026-01-31T00:00:00Z");
  const monthly = periodEnd(jan31, "MONTHLY");
  assert.equal(monthly.getUTCMonth(), 1, "one month later, not 30 days");
  assert.equal(monthly.getUTCFullYear(), 2026);
  const yearly = periodEnd(jan31, "YEARLY");
  assert.equal(yearly.getUTCFullYear(), 2027);
  assert.equal(yearly.getUTCMonth(), 0);
  const feb = periodEnd(new Date("2026-07-15T00:00:00Z"), "MONTHLY");
  assert.equal(feb.getUTCMonth(), 7, "no month-boundary drift");
});
