import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const ORIGIN = "https://amlakplus.app";
const LISTING = `${ORIGIN}/estates?district=jannat-abadi&price=20-25`;

// The real markup of an amlakplus listing card, including the phone bottom
// sheet: a Vuetify `.v-dialog--active.v-bottom-sheet` that has no
// `role="dialog"` and no `.v-dialog__content`.
const pageHtml = `<!doctype html>
<html lang="fa"><body>
<div class="col col-12">
  <div class="estate-box-wrapper pb-5">
    <div class="estate-box v-card v-sheet theme--light elevation-0 ashian-import-host">
      <div class="container px-4 py-3 container--fluid">
        <div class="row no-gutters">
          <div class="pl-2 col col-7">
            <div class="estate-box__main-info d-flex flex-column h-full pb-2 justify-space-between">
              <div class="estate-box__region d-flex align-center">
                <span class="amlak-plus-gray-4--text text-caption mx-2"> جنت‌آباد شمالی </span>
                <span class="primary--text px-1 v-chip"><span class="v-chip__content"> خرید، فروش </span></span>
              </div>
              <h3 class="text-body-1 font-weight-black my-1"> خیابان شهریار شرقی پ 18 </h3>
              <div class="estate-box__price">
                <div class="d-flex w-full align-center justify-space-between mb-1">
                  <div class="primary--text text-body-2">قیمت:</div>
                  <div class="amlak-plus-green-1--text font-weight-black"><span> 22.5  میلیارد تومان</span></div>
                </div>
                <div class="d-flex w-full align-center justify-space-between">
                  <div class="primary--text text-body-2">متر مربع:</div>
                  <div class="amlak-plus-green-1--text font-weight-black"><span> 225  میلیون تومان</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr class="v-divider theme--light">
        <div class="meta px-2 d-flex align-center text-body-2 justify-space-between py-3">
          <span class="font-weight-black mr-1"> 1405/07/07 </span>
          <span class="px-2"> 100 متر </span>
          <span class="px-2"> 2 خواب </span>
          <span class="px-2"> طبقه 2 </span>
          <span class="px-2"> 1375 </span>
        </div>
        <div class="d-flex justify-space-between w-full actions" can-get-phone="true">
          <button type="button" class="v-btn v-btn--has-bg v-btn--tile transparent">
            <span class="v-btn__content"> نمایش شماره </span>
          </button>
          <button type="button" class="v-btn v-btn--has-bg v-btn--tile amlak-plus-green-1 flex-fill">
            <span class="v-btn__content"> توضیحات بیشتر <i class="v-icon mdi mdi-chevron-down"></i></span>
          </button>
        </div>
      </div>
      <div class="description__text">آپارتمان ۱۰۰ متری دو خواب در جنت‌آباد شمالی، پلاک واحد.</div>
    </div>
  </div>
</div>
<div class="col col-12">
  <div class="estate-box-wrapper pb-5">
    <div class="estate-box v-card v-sheet theme--light elevation-0">
      <div class="container px-4 py-3 container--fluid">
        <div class="row no-gutters">
          <div class="pl-2 col col-7">
            <div class="estate-box__main-info d-flex flex-column h-full pb-2 justify-space-between">
              <div class="estate-box__region d-flex align-center">
                <span class="amlak-plus-gray-4--text text-caption mx-2"> یوسف‌آباد </span>
                <span class="primary--text px-1 v-chip"><span class="v-chip__content"> رهن، اجاره </span></span>
              </div>
              <h3 class="text-body-1 font-weight-black my-1"> خیابان اسدآبادی کوچه یکم پ 3 </h3>
              <div class="estate-box__price">
                <div class="d-flex w-full align-center justify-space-between mb-1">
                  <div class="primary--text text-body-2">قیمت:</div>
                  <div class="amlak-plus-green-1--text font-weight-black"><span> 400  میلیون تومان</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="meta px-2 d-flex align-center text-body-2 justify-space-between py-3">
          <span class="px-2"> 70 متر </span>
          <span class="px-2"> 1 خواب </span>
        </div>
        <div class="d-flex justify-space-between w-full actions" can-get-phone="true">
          <button type="button" class="v-btn v-btn--has-bg v-btn--tile transparent">
            <span class="v-btn__content"> نمایش شماره </span>
          </button>
        </div>
      </div>
      <div class="description__text">آپارتمان ۷۰ متری یک خواب در یوسف‌آباد.</div>
    </div>
  </div>
</div>
<script>
  window.__clicks = [];
  const PHONES = ["09121960997", "09351234455"];
  document.querySelectorAll(".estate-box").forEach((card, cardIndex) => {
    const phoneButton = [...card.querySelectorAll("button")].find((node) =>
      /نمایش\\s*شماره/.test(node.textContent || ""),
    );
    phoneButton.addEventListener("click", () => {
      window.__clicks.push("phone");
    const sheet = document.createElement("div");
    sheet.setAttribute("tabindex", "0");
    sheet.className = "v-dialog v-dialog--active v-bottom-sheet";
    sheet.innerHTML =
      '<div class="bottom-sheet-panel text-center rounded-tl rounded-tr v-sheet theme--light">' +
        '<div class="bottom-sheet-panel__header d-flex justify-space-between align-center px-10 pt-8 pb-4">' +
          '<h4 class="font-weight-black text-h6"> نمایش شماره </h4>' +
          // A trap control before the real close button: a blind "first button"
          // click would hit it and navigate away, losing the filters.
          '<button type="button" class="v-btn v-btn--icon" id="trap"><span class="v-btn__content">اشتراک‌گذاری</span></button>' +
          '<button type="button" class="v-btn v-btn--icon v-btn--round v-btn--text"><span class="v-btn__content">' +
            '<i class="v-icon mdi mdi-close theme--light"></i></span></button>' +
        '</div>' +
        '<div class="bottom-sheet-panel__body px-10"><div class="d-flex justify-center" style="height: 72px;">' +
          '<button type="button" class="v-btn v-btn--has-bg v-btn--tile amlak-plus-gray-6 rounded">' +
            '<span class="v-btn__content"> ' + PHONES[cardIndex] + ' </span></button>' +
        '</div></div>' +
      '</div>';
    document.body.append(sheet);
    sheet.querySelector("#trap").addEventListener("click", () => {
      window.__clicks.push("trap");
      location.href = "${ORIGIN}/lost?filters=gone";
    });
    sheet.querySelector(".mdi-close").closest("button").addEventListener("click", () => {
      window.__clicks.push("close");
      sheet.remove();
    });
    });
  });
</script>
</body></html>`;

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.route(`${ORIGIN}/**`, (route) =>
    route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: pageHtml }),
  );
  await page.goto(LISTING);
  await page.addScriptTag({ path: "extension/sites/amlakplus/adapter.js" });

  type Extracted = {
    phone: string | null;
    neighborhood: string;
    area: number;
    salePrice: number;
    mortgagePrice: number;
    sourceUrl: string;
  };
  // Real usage clicks one card at a time, so the sheets must not overlap.
  const extractAll = async () => {
    const cards = await page.evaluate(() => document.querySelectorAll(".estate-box").length);
    const results = [];
    for (let index = 0; index < cards; index += 1) {
      results.push(
        await page.evaluate(async (cardIndex) => {
          const adapter = (
            window as unknown as {
              AshianAmlakPlusAdapter: { extractProperty: (card: Element) => Promise<Extracted> };
            }
          ).AshianAmlakPlusAdapter;
          return adapter.extractProperty(document.querySelectorAll(".estate-box")[cardIndex]);
        }, index),
      );
    }
    return results;
  };
  const [first, second] = await extractAll();
  // The same listing reloaded must produce the same identity again, otherwise
  // the same card would be imported over and over.
  const [firstAgain] = await extractAll();
  const clicks: string[] = await page.evaluate(
    () => (window as unknown as { __clicks: string[] }).__clicks,
  );
  const href: string = await page.evaluate(() => location.href);
  const sheetGone = await page.evaluate(() => !document.querySelector(".v-dialog--active"));

  assert.deepEqual(errors, [], "the page must stay error free");
  assert.equal(first.phone, "09121960997", "the bottom sheet phone must be extracted");
  assert.equal(second.phone, "09351234455", "each card must read its own sheet");
  assert.equal(href, LISTING, "the page must never navigate");
  assert.ok(!clicks.includes("trap"), "must not blind-click a sheet control");
  assert.ok(clicks.includes("close"), "must close the sheet through its own close icon");
  assert.ok(sheetGone, "the sheet must be gone after extraction");
  assert.equal(first.neighborhood, "جنت‌آباد شمالی", "the region must still parse");
  assert.equal(first.area, 100, "the area must still parse");
  assert.equal(first.salePrice, 22_500_000_000, "the price must still parse");

  // Two cards on one listing must not share a dedup key, and re-reading the
  // same card must produce the very same key.
  assert.notEqual(
    first.sourceUrl,
    second.sourceUrl,
    "two cards on one listing must not collide on sourceUrl",
  );
  assert.equal(
    first.sourceUrl,
    firstAgain.sourceUrl,
    "the same card must always produce the same sourceUrl",
  );
  assert.ok(
    first.sourceUrl.startsWith(LISTING),
    `sourceUrl must keep the listing context, got ${first.sourceUrl}`,
  );
  assert.ok(new URL(first.sourceUrl).hash.length > 1, "sourceUrl must carry a per-card key");
  console.log(
    `ok - amlakplus: phones ${first.phone}/${second.phone}, distinct keys ${first.sourceUrl} vs ${second.sourceUrl}, no navigation`,
  );
} finally {
  await browser.close();
}
