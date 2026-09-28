import { config } from "dotenv";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { randomUUID, createHmac } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { toJalaali } from "jalaali-js";
config({ path: ".env.local" });
const { db } = await import("../src/lib/db");
const tag = `آزمون رابط ${randomUUID().slice(0, 8)}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
let ownerId: string | undefined;
const jalali = (date: Date) => {
  const j = toJalaali(date);
  return `${j.jy}/${j.jm}/${j.jd}`;
};
try {
  await page.goto("http://localhost:3000/login");
  await page
    .getByLabel("نام کاربری", { exact: true })
    .fill(process.env.ADMIN_USERNAME!);
  await page
    .getByLabel("رمز عبور", { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ورود به پنل مدیریت" }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("http://localhost:3000/owners/new");
  await page.getByLabel("نام و نام خانوادگی").fill(tag);
  await page.locator("#mobile").fill("09120000004");
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL(/\/owners\/(?!new)/);
  ownerId = page.url().split("/").pop()!;
  await page.goto("http://localhost:3000/properties/new");
  await page.getByLabel("عنوان فایل").fill(tag);
  await page.getByRole("combobox", { name: "مالک", exact: true }).fill(tag);
  await page.getByRole("option", { name: new RegExp(tag) }).click();
  await page.getByLabel("نوع معامله", { exact: true }).selectOption("RENT");
  await page.locator("#neighborhood").fill("محله آزمون");
  await page.locator("#address").fill("آدرس موقت آزمون");
  await page.getByLabel("متراژ (متر مربع)").fill("120");
  await page.getByLabel("مبلغ رهن (تومان)").fill("500000000");
  await page.getByLabel("اجاره ماهانه (تومان)").fill("10000000");
  await page.getByLabel("رهن و اجاره قابل تبدیل است").check();
  await page.getByText("معادل اجارهٔ رهن واردشده:", { exact: false }).waitFor();
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL(/\/properties\/(?!new)/);
  const propertyId = page.url().split("/").pop()!;
  await page
    .locator("input[type=file]")
    .setInputFiles("public/icons/icon-192.png");
  await page.locator(".property-gallery img").waitFor();
  assert.equal(await db.propertyImage.count({ where: { propertyId } }), 1);
  await page.getByRole("link", { name: "ویرایش فایل" }).click();
  await page.getByLabel("عنوان فایل").fill(tag + " ویرایش");
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL(`**/properties/${propertyId}`);
  await page
    .getByRole("heading", { name: tag + " ویرایش", exact: true })
    .waitFor();
  await page.goto(
    `http://localhost:3000/follow-ups/new?propertyId=${propertyId}`,
  );
  await page.getByLabel("شرح پیگیری").fill(tag + " تماس");
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL("**/follow-ups");
  await page
    .getByRole("heading", { name: tag + " تماس", exact: true })
    .waitFor();
  await page.goto(
    `http://localhost:3000/contracts/new?propertyId=${propertyId}`,
  );
  await page.locator("#tenantName").fill(tag);
  await page.getByLabel("شماره همراه مستأجر").fill("09120000005");
  await page.getByLabel("تاریخ شروع").fill(jalali(new Date()));
  await page
    .getByLabel("تاریخ پایان")
    .fill(jalali(new Date(Date.now() + 365 * 86400000)));
  await page.locator("#mortgageAmount").fill("500000000");
  await page.getByLabel("اجاره ماهانه (تومان)").fill("10000000");
  await page
    .getByRole("button", { name: "باز کردن تقویم شمسی" })
    .first()
    .click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "بستن", exact: true }).click();
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL(/\/contracts\/(?!new)/);
  const contractId = page.url().split("/").pop()!;
  assert.equal(
    await db.reminder.count({ where: { leaseContractId: contractId } }),
    4,
  );
  await page.getByRole("link", { name: "تمدید قرارداد", exact: true }).click();
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL(/\/contracts\/(?!new)/);
  assert.equal(
    (await db.leaseContract.findUniqueOrThrow({ where: { id: contractId } }))
      .status,
    "RENEWED",
  );
  // Verify private files and the search API reject a signed-out request.
  const publicContext = await browser.newContext();
  assert.equal(
    (
      await publicContext.request.get(
        "http://localhost:3000/api/search?q=آزمون",
      )
    ).status(),
    401,
  );
  const image = await db.propertyImage.findFirstOrThrow({
    where: { propertyId },
  });
  assert.equal(
    (
      await publicContext.request.get("http://localhost:3000" + image.url)
    ).status(),
    401,
  );
  await publicContext.close();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`http://localhost:3000/properties/${propertyId}/edit`);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const cookies = await context.cookies();
  const token = cookies.find((c) => c.name === "ashian-session")?.value;
  if (token)
    await db.session.delete({
      where: {
        id: createHmac("sha256", process.env.NEXTAUTH_SECRET!)
          .update(token)
          .digest("hex"),
      },
    });
  await page.getByRole("button", { name: "ذخیره اطلاعات" }).click();
  await page.waitForURL("**/login");
  console.log(
    "PASS: UI owner/property create and edit, image upload, follow-up, Jalali calendar, contract/renewal, protected APIs/images, mobile form, revoked session on action.",
  );
} finally {
  if (!ownerId)
    ownerId = (await db.owner.findFirst({ where: { fullName: tag } }))?.id;
  if (ownerId) {
    const images = await db.propertyImage.findMany({
      where: { property: { ownerId } },
    });
    await db.$transaction(async (tx) => {
      await tx.reminder.deleteMany({ where: { ownerId } });
      await tx.followUp.deleteMany({ where: { ownerId } });
      await tx.leaseContract.updateMany({
        where: { ownerId },
        data: { previousContractId: null },
      });
      await tx.leaseContract.deleteMany({ where: { ownerId } });
      await tx.propertyStatusHistory.deleteMany({
        where: { property: { ownerId } },
      });
      await tx.property.deleteMany({ where: { ownerId } });
      await tx.owner.delete({ where: { id: ownerId } });
    });
    for (const image of images) {
      const key = image.url.split("/").pop();
      if (key && /^[a-f0-9-]{36}\.webp$/.test(key))
        await unlink(
          path.resolve(process.env.UPLOAD_DIR ?? "uploads", key),
        ).catch(() => {});
    }
  }
  await browser.close();
  await db.$disconnect();
}
