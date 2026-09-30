import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const ORIGIN = "https://divar.ir";
const LISTING = `${ORIGIN}/real-estate?filters=price-5-10,dist-m-Tehran`;

const pageHtml = (dialogHasClose: boolean) => `<!doctype html>
<html lang="fa"><body>
<main>
  <h1 data-testid="title">آپارتمان ۹۰ متری در سعادت‌آباد</h1>
  <div class="kt-group-row">
    <div class="kt-group-row__heading">
      <div class="kt-group-row-item__title">متراژ</div>
    </div>
    <div class="kt-group-row__data-row">
      <div class="kt-group-row-item__value">۹۰ متر</div>
    </div>
  </div>
  <div data-testid="unexpandable-info-row" class="kt-unexpandable-row">
    <div class="kt-unexpandable-row__title">قیمت</div>
    <div class="kt-unexpandable-row__value">۵ میلیارد</div>
  </div>
  <div id="images"></div>
  <button id="gallery" aria-label="تصویر بعدی">تصویر بعدی</button>
  <button id="phone">نمایش شماره</button>
</main>
<script>
  window.__clicks = [];
  const addImage = (index) => {
    const img = document.createElement("img");
    img.setAttribute("data-testid", "image-element");
    img.src = "https://dl.divarcdn.com/photo-" + index + ".jpg";
    document.getElementById("images").append(img);
  };
  addImage(0);
  // The live site replaces the gallery control after every advance, so a stale
  // snapshot would either click detached nodes or skip the remaining images.
  const advanceGallery = () => {
    const button = document.getElementById("gallery");
    if (!button) return;
    window.__clicks.push("gallery-" + button.dataset.node);
    addImage(window.__clicks.length);
    button.remove();
    const next = document.createElement("button");
    next.id = "gallery";
    next.dataset.node = String(Number(button.dataset.node) + 1);
    next.setAttribute("aria-label", "تصویر بعدی");
    next.textContent = "تصویر بعدی";
    next.addEventListener("click", advanceGallery);
    document.querySelector("main").append(next);
  };
  document.getElementById("gallery").dataset.node = "0";
  document.getElementById("gallery").addEventListener("click", advanceGallery);
  document.getElementById("phone").addEventListener("click", () => {
    window.__clicks.push("phone");
    const row = document.createElement("div");
    row.className = "kt-unexpandable-row";
    row.innerHTML =
      '<div class="kt-unexpandable-row__title">شماره موبایل</div>' +
      '<div class="kt-unexpandable-row__value">۰۹۱۲۱۲۳۴۵۶۷</div>';
    document.querySelector("main").append(row);
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.innerHTML =
      '<button id="trap">نمایش در نقشه</button>' +
      '${dialogHasClose ? '<button aria-label="بستن">✕</button>' : ""}';
    document.body.append(dialog);
    // Clicking the first dialog button is what used to navigate away and wipe
    // the filters the user had set.
    dialog.querySelector("#trap").addEventListener("click", () => {
      window.__clicks.push("trap");
      location.href = "${ORIGIN}/map?filters=lost";
    });
    const closeButton = dialog.querySelector('[aria-label="بستن"]');
    if (closeButton)
      closeButton.addEventListener("click", () => {
        window.__clicks.push("close");
        dialog.remove();
      });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") window.__clicks.push("escape");
  });
</script>
</body></html>`;

const browser = await chromium.launch({ channel: "msedge", headless: true });

type ExtractedProperty = { images: string[]; phone: string | null };

async function extract(dialogHasClose: boolean) {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(`${ORIGIN}/**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: pageHtml(dialogHasClose),
    }),
  );
  await page.goto(LISTING);
  await page.addScriptTag({ path: "extension/sites/divar/adapter.js" });
  const property = await page.evaluate(async () => {
    const card = document.querySelector("main")!;
    const adapter = (
      window as unknown as {
        AshianSiteAdapter: {
          extractProperty: (card: Element) => Promise<ExtractedProperty>;
        };
      }
    ).AshianSiteAdapter;
    return adapter.extractProperty(card);
  });
  const clicks: string[] = await page.evaluate(
    () => (window as unknown as { __clicks: string[] }).__clicks,
  );
  const href: string = await page.evaluate(() => location.href);
  await page.close();
  return { property, clicks, href, errors };
}

try {
  for (const dialogHasClose of [false, true]) {
    const label = dialogHasClose ? "dialog with a close control" : "dialog without a close control";
    const { property, clicks, href, errors } = await extract(dialogHasClose);

    assert.deepEqual(errors, [], `${label}: the page must stay error free`);
    assert.equal(href, LISTING, `${label}: the page must never navigate`);
    assert.ok(!clicks.includes("trap"), `${label}: must not blind-click a dialog button`);
    if (dialogHasClose) {
      assert.ok(clicks.includes("close"), `${label}: must use the close control`);
      assert.ok(!clicks.includes("escape"), `${label}: must not need the Escape fallback`);
    } else {
      assert.ok(clicks.includes("escape"), `${label}: must fall back to Escape`);
    }

    const galleryClicks = clicks.filter((click) => click.startsWith("gallery-"));
    assert.ok(
      galleryClicks.length >= 5,
      `${label}: expected the live gallery to be walked, got ${galleryClicks.length} clicks`,
    );
    assert.equal(
      new Set(galleryClicks).size,
      galleryClicks.length,
      `${label}: no gallery control may be clicked twice`,
    );
    assert.ok(
      property.images.length >= 5,
      `${label}: expected the images the live gallery revealed, got ${property.images.length}`,
    );
    assert.equal(property.phone, "09121234567", `${label}: the contact phone must survive`);
    console.log(`ok - ${label}: stayed on the listing, collected ${property.images.length} images`);
  }
} finally {
  await browser.close();
}
