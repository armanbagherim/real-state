import { config } from "dotenv";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
config({ path: ".env.local" });
await mkdir(".artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = "http://localhost:3000";
try {
  await page.goto(`${base}/properties`);
  await page.waitForURL("**/login");
  await page.screenshot({
    path: ".artifacts/login-desktop.png",
    fullPage: true,
  });
  await page
    .getByLabel("نام کاربری", { exact: true })
    .fill(process.env.ADMIN_USERNAME!);
  await page
    .getByLabel("رمز عبور", { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ورود به پنل مدیریت" }).click();
  await page.waitForURL("**/dashboard", { timeout: 60000 });
  await page.getByRole("heading", { name: "داشبورد", exact: true }).waitFor();
  await page.screenshot({
    path: ".artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  for (const route of [
    "/properties",
    "/properties/sale",
    "/properties/rent",
    "/properties/rented",
    "/properties/sold",
    "/properties/new",
    "/owners",
    "/owners/new",
    "/contracts",
    "/contracts/new",
    "/follow-ups",
    "/follow-ups/new",
    "/reminders",
    "/reminders/new",
    "/settings",
  ]) {
    const response = await page.goto(base + route);
    assert.equal(response?.status(), 200, route);
    await page.locator("h1").waitFor();
    assert.equal(
      await page
        .getByText("بارگذاری اطلاعات انجام نشد", { exact: true })
        .count(),
      0,
      route,
    );
  }
  await page.goto(`${base}/properties`);
  const propertyLink = page.locator(".property-identity").first();
  const propertyPath = await propertyLink.getAttribute("href");
  assert.ok(propertyPath);
  await propertyLink.click();
  await page.locator(".detail-grid").waitFor();
  await page.screenshot({
    path: ".artifacts/property-desktop.png",
    fullPage: true,
  });
  await page.goto(base + propertyPath + "/edit");
  await page.getByLabel("عنوان فایل").waitFor();
  await page.goto(`${base}/dashboard`);
  await page.getByLabel("جستجوی سراسری").fill("نمونه");
  await page.locator(".search-results a").first().waitFor();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${base}/dashboard`);
  await page.screenshot({
    path: ".artifacts/dashboard-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Dashboard mobile overflow",
  );
  await page.getByLabel("باز کردن منو").click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "همه فایل‌ها", exact: true })
    .click();
  await page.waitForURL("**/properties");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Properties mobile overflow",
  );
  await page.screenshot({
    path: ".artifacts/properties-mobile.png",
    fullPage: true,
  });
  await page.goto(`${base}/contracts/new`);
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    "Contract form mobile overflow",
  );
  await page.goto(`${base}/manifest.webmanifest`);
  assert.ok((await page.textContent("body"))?.includes("standalone"));
  assert.deepEqual(errors, []);
  console.log(
    "PASS: protected routes, login, 15 application routes, property details/edit, global search, 375px mobile layout, drawer, PWA manifest; no browser runtime errors.",
  );
} finally {
  await browser.close();
}
