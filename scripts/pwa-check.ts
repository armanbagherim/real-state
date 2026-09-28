import { config } from "dotenv";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
config({ path: ".env.local" });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({
  viewport: { width: 812, height: 375 },
  reducedMotion: "reduce",
});
try {
  const page = await context.newPage();
  await page.goto("http://localhost:3000/login");
  await page.locator("#username").fill(process.env.ADMIN_USERNAME!);
  await page.locator("#password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ورود به پنل مدیریت" }).click();
  await page.waitForURL("**/dashboard");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  assert.ok(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = [];
    for (const name of names) {
      const cache = await caches.open(name);
      for (const request of await cache.keys())
        urls.push(new URL(request.url).pathname);
    }
    return urls;
  });
  assert.ok(cached.includes("/offline.html"));
  assert.ok(
    cached.every((url) => url === "/offline.html" || url.startsWith("/icons/")),
  );
  await context.setOffline(true);
  await page.goto("http://localhost:3000/properties");
  await page
    .getByRole("heading", { name: "ارتباط اینترنت برقرار نیست" })
    .waitFor();
  console.log(
    "PASS: active production service worker, safe offline cache, offline navigation fallback, 812px landscape with reduced motion.",
  );
} finally {
  await browser.close();
}
