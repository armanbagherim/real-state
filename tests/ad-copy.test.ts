import { test } from "node:test";
import assert from "node:assert/strict";
import { composeAdCopy, type AdCopyInput } from "../src/services/ad-copy/generator";

const base: AdCopyInput = {
  transactionType: "SALE",
  propertyType: "آپارتمان",
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
  salePrice: 3_950_000_000,
  mortgagePrice: 0,
  rentPrice: 0,
  city: "تهران",
  district: "منطقه ۵",
  neighborhood: "بلوار فردوس",
  description: "",
  hasImages: true,
  agentName: "آرمان",
  currentYear: 1405,
};

test("divar copy uses the requested section markers and bold specs", () => {
  const out = composeAdCopy(base, "DIVAR");
  assert.match(out, /▪︎▪︎▪︎ \*\*توضیحات داخل واحد\*\* ▪︎▪︎▪︎/);
  assert.match(out, /▪︎▪︎▪︎ \*\*توضیحات ساختمان و موقعیت\*\* ▪︎▪︎▪︎/);
  assert.match(out, /\*\*۷۲ متر\*\*/, "area is bolded");
  assert.match(out, /\*\*۲ خواب\*\*/, "bedrooms are bolded");
  assert.match(out, /آسانسور: ✅ دارد/);
  assert.match(out, /پارکینگ: ✅ دارد/);
  assert.match(out, /انباری: ✅ دارد/);
  assert.match(out, /\*\*قیمت: ۳٬۹۵۰٬۰۰۰٬۰۰۰ تومان\*\*/);
  assert.match(out, /\*\*مشاور شما، آرمان\*\*/, "agent is not hardcoded");
  assert.match(out, /عکس‌های آگهی واقعی و مربوط به خود ملک هستند/);
});

test("generator never claims an amenity the property does not have", () => {
  const bare: AdCopyInput = {
    ...base,
    parking: false,
    storage: false,
    elevator: false,
    balcony: false,
  };
  const out = composeAdCopy(bare, "DIVAR");
  assert.doesNotMatch(out, /آسانسور/);
  assert.doesNotMatch(out, /پارکینگ/);
  assert.doesNotMatch(out, /انباری/);
  assert.doesNotMatch(out, /بالکن/);
  assert.doesNotMatch(out, /✅/);
  // the unit itself is still described, since area/floor/bedrooms are real
  assert.match(out, /\*\*۷۲ متر\*\*/);
});

test("rent copy prints deposit and rent, and full-deposit rent omits rent", () => {
  const rent = composeAdCopy(
    { ...base, transactionType: "RENT", salePrice: 0, mortgagePrice: 800_000_000, rentPrice: 25_000_000 },
    "DIVAR",
  );
  assert.match(rent, /\*\*رهن: ۸۰۰٬۰۰۰٬۰۰۰ تومان\*\*/);
  assert.match(rent, /\*\*اجاره: ۲۵٬۰۰۰٬۰۰۰ تومان\*\*/);
  assert.doesNotMatch(rent, /قیمت:/);

  const full = composeAdCopy(
    { ...base, transactionType: "RENT", salePrice: 0, mortgagePrice: 800_000_000, rentPrice: 0 },
    "DIVAR",
  );
  assert.match(full, /\*\*رهن کامل: ۸۰۰٬۰۰۰٬۰۰۰ تومان\*\*/);
});

test("build year is derived from age and omitted when age is unknown", () => {
  assert.match(composeAdCopy(base, "DIVAR"), /ساخت ۱۳۹۸/);
  // "ساخت " + a year; "ساختمان" in the hook must not trip this.
  assert.doesNotMatch(
    composeAdCopy({ ...base, buildingAge: 0 }, "DIVAR"),
    /ساخت [۰-۹]/,
    "no invented build year",
  );
});

test("image disclaimer only appears when the listing actually has images", () => {
  assert.doesNotMatch(
    composeAdCopy({ ...base, hasImages: false }, "DIVAR"),
    /عکس‌های آگهی واقعی/,
  );
});

test("empty sections are dropped rather than padded", () => {
  const sparse: AdCopyInput = {
    ...base,
    area: 50,
    bedrooms: 0,
    floor: 0,
    buildingAge: 0,
    unitsPerFloor: 4,
    city: "",
    district: "",
    neighborhood: "",
    parking: false,
    storage: false,
    elevator: false,
    balcony: false,
    hasImages: false,
    agentName: "",
  };
  const out = composeAdCopy(sparse, "DIVAR");
  assert.match(out, /\*\*۵۰ متر\*\*/, "area alone is still real content");
  assert.doesNotMatch(out, /توضیحات ساختمان و موقعیت/, "no location data, no section");
  assert.doesNotMatch(out, /مشاور شما/, "no agent name available");
});

test("short variants stay short and drop the divar section markers", () => {
  const wa = composeAdCopy(base, "WHATSAPP");
  assert.doesNotMatch(wa, /▪︎▪︎▪︎/);
  assert.ok(wa.length < composeAdCopy(base, "DIVAR").length);
  const ig = composeAdCopy(base, "INSTAGRAM");
  assert.doesNotMatch(ig, /▪︎▪︎▪︎/);
  assert.ok(ig.length < composeAdCopy(base, "DIVAR").length);
});

test("hook varies with the real strongest trait", () => {
  const topFloor = composeAdCopy({ ...base, floor: 7, totalFloors: 7 }, "DIVAR");
  const lowUnits = composeAdCopy({ ...base, unitsPerFloor: 1 }, "DIVAR");
  assert.match(topFloor, /طبقه آخر/);
  assert.match(lowUnits, /کم‌جمعیت|نور|بالکن|آسانسور|پارکینگ/);
});

test("no AI-cliché phrasing appears in any variant", () => {
  const banned = [
    "منحصر به فرد",
    "فرصتی استثنایی",
    "سرمایه‌گذاری",
    "خانه‌ای رویایی",
  ];
  for (const variant of ["DIVAR", "INSTAGRAM", "WHATSAPP", "CUSTOMER"] as const) {
    const out = composeAdCopy(base, variant);
    for (const phrase of banned) assert.ok(!out.includes(phrase), `${variant}: ${phrase}`);
  }
});