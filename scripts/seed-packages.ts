import { config } from "dotenv";
import { db } from "../src/lib/db";
config({ path: ".env" });

const tiers = [
  {
    name: "شروع",
    description: "برای دفاتر کوچک که تازه شروع کرده‌اند",
    monthlyPrice: 249_000,
    yearlyPrice: 2_490_000,
    propertyLimit: 200,
    agentLimit: 2,
    color: "#2f7a1f",
    badge: "شروع کن",
    sortOrder: 1,
  },
  {
    name: "حرفه‌ای",
    description: "برای دفاتر فعال با حجم فایل بالا",
    monthlyPrice: 349_000,
    yearlyPrice: 3_490_000,
    propertyLimit: 500,
    agentLimit: 4,
    color: "#0f5f8f",
    badge: "پرطرفدار",
    sortOrder: 2,
  },
  {
    name: "تیمی",
    description: "برای مجموعه‌های چند‌دفتری و تیم‌های بزرگ",
    monthlyPrice: 449_000,
    yearlyPrice: 3_990_000,
    propertyLimit: 1000,
    agentLimit: 6,
    color: "#7a3fbf",
    badge: "بهترین ارزش",
    sortOrder: 3,
  },
];

for (const t of tiers) {
  const pkg = await db.package.upsert({
    where: { id: t.name },
    update: {
      name: t.name,
      description: t.description,
      monthlyPrice: t.monthlyPrice,
      yearlyPrice: t.yearlyPrice,
      propertyLimit: t.propertyLimit,
      agentLimit: t.agentLimit,
      color: t.color,
      badge: t.badge,
      sortOrder: t.sortOrder,
      active: true,
      internal: false,
    },
    create: {
      id: t.name,
      name: t.name,
      description: t.description,
      monthlyPrice: t.monthlyPrice,
      yearlyPrice: t.yearlyPrice,
      propertyLimit: t.propertyLimit,
      agentLimit: t.agentLimit,
      color: t.color,
      badge: t.badge,
      sortOrder: t.sortOrder,
      active: true,
      internal: false,
    },
  });
  const full = t.monthlyPrice * 12;
  const off = Math.round((1 - t.yearlyPrice / full) * 100);
  console.log(
    `${pkg.name.padEnd(8)} | ماهانه ${t.monthlyPrice.toLocaleString(
      "en",
    )} | سالانه ${t.yearlyPrice.toLocaleString("en")} | تخفیف ${off}% | تا ${
      t.propertyLimit
    } فایل | ${t.agentLimit} مشاور`,
  );
}
console.log(`\ntotal packages: ${await db.package.count()}`);
await db.$disconnect();
