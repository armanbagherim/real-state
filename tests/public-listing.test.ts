import { test } from "node:test";
import assert from "node:assert/strict";
import { toPublicProperty } from "../src/lib/public-property";

const property = (over: Record<string, unknown> = {}) => ({
  id: "p1",
  fileCode: "A-1010",
  title: "آپارتمان ۷۲ متری",
  transactionType: "SALE",
  propertyType: "آپارتمان",
  status: "ACTIVE",
  city: "تهران",
  district: "منطقه ۵",
  neighborhood: "بلوار فردوس",
  address: "پلاک ۱۲، کوچه دقیق",
  area: 72,
  bedrooms: 2,
  floor: 4,
  totalFloors: 7,
  unitsPerFloor: 2,
  buildingAge: 7,
  parking: true,
  storage: true,
  elevator: true,
  balcony: true,
  salePrice: 3950000000,
  mortgagePrice: 0,
  rentPrice: 0,
  isConvertible: false,
  conversionRate: null,
  accessBlockedAt: null,
  description: "توضیح ملک",
  internalNotes: "یادداشت داخلی دفتر: فروشنده تخفیف می‌خواهد",
  source: "divar",
  sourceUrl: "https://divar.ir/v/x",
  contactPhone: "09121234567",
  ownerId: "o1",
  officeId: "off1",
  ownerUserId: "u1",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  images: [
    { id: "i1", url: "/api/images/1.webp", sortOrder: 0 },
    { id: "i2", url: "/api/images/2.webp", sortOrder: 1 },
  ],
  ownerUser: { name: "آرمان", mobile: "09120000000" },
  office: { name: "املاک آشیان", phone: "02100000000" },
  owner: { id: "o1", fullName: "مالک محرمانه", mobile: "09350000000" },
  ...over,
});

/** `link` holds the sharing flags, `prop` holds the property overrides. */
const link = (
  linkOver: Record<string, unknown> = {},
  propOver: Record<string, unknown> = {},
) =>
  ({
    id: "link1",
    token: "abc123xy",
    propertyId: "p1",
    createdByUserId: "u1",
    isActive: true,
    showAddress: false,
    showPhone: true,
    views: 3,
    phoneClicks: 1,
    visitRequests: 0,
    lastViewedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    property: property(propOver),
    ...linkOver,
  }) as never;

test("public DTO exposes only customer-safe fields", () => {
  const dto = toPublicProperty(link());
  assert.equal(dto.title, "آپارتمان ۷۲ متری");
  assert.equal(dto.area, 72);
  assert.equal(dto.agent.name, "آرمان");
  assert.equal(dto.images.length, 2);
});

test("public DTO never leaks internal CRM fields", () => {
  const serialized = JSON.stringify(toPublicProperty(link()));
  for (const secret of [
    "A-1010", // fileCode
    "یادداشت داخلی", // internalNotes
    "مالک محرمانه", // owner name
    "09350000000", // owner mobile
    "09121234567", // owner contactPhone
    "divar", // external source
    "p1", // property id
    "off1", // office id
    "o1", // owner id
  ])
    assert.ok(!serialized.includes(secret), `leaked: ${secret}`);
});

test("address is withheld unless the sharing consultant enabled it", () => {
  assert.equal(toPublicProperty(link()).address, "");
  assert.match(
    toPublicProperty(link({ showAddress: true })).address,
    /پلاک/,
  );
});

test("phone is withheld unless the link allows it", () => {
  assert.equal(toPublicProperty(link({ showPhone: false })).agent.mobile, "");
  assert.equal(toPublicProperty(link()).agent.mobile, "09120000000");
});

test("agent name is kept even when the phone is hidden", () => {
  assert.equal(
    toPublicProperty(link({ showPhone: false })).agent.name,
    "آرمان",
  );
});

test("missing ownerUser and office degrade gracefully instead of throwing", () => {
  const dto = toPublicProperty(link({}, { ownerUser: null, office: null }));
  assert.equal(dto.agent.name, "");
  assert.equal(dto.agent.mobile, "");
  assert.equal(dto.office.name, "املاک آشیان");
});

test("decimal money fields become numbers", () => {
  const dto = toPublicProperty(link());
  assert.equal(dto.salePrice, 3950000000);
  assert.equal(dto.mortgagePrice, 0);
});