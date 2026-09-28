import { test } from "node:test";
import assert from "node:assert/strict";
import { reminderDates } from "../src/services/contracts";
import {
  contractSchema,
  propertySchema,
  settingsSchema,
} from "../src/lib/validation";
import { tehranDayRange, normalizeDigits } from "../src/lib/utils";
import { propertyWhere } from "../src/repositories/properties";
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
