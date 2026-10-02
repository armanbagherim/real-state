import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// Minimal window stub: the adapter only touches window/location at load time.
const sandbox: Record<string, unknown> = {
  location: { hostname: "divar.ir", href: "https://divar.ir/v/test/abc123" },
  URL,
  KeyboardEvent: class {},
  setTimeout,
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync("extension/sites/divar/adapter.js", "utf8"),
  sandbox,
);

type FakeNode = { textContent: string };
type Parse = {
  descriptionOf: (root: unknown) => string;
  amenityTable: (root: unknown) => Record<string, boolean>;
  hasAmenity: (haystack: string, word: string) => boolean;
  blockText: (node: FakeNode | null) => string;
};
const parse = (sandbox.window as { AshianDivarParse: Parse }).AshianDivarParse;

/** Fake node exposing only what the helpers actually call. */
const fakeText = (value: string): FakeNode => ({ textContent: value });
const fakeCell = (label: string, icon?: string, disabled = false) => ({
  textContent: label,
  classList: {
    contains: (c: string) => c === "kt-group-row-item--disabled" && disabled,
  },
  querySelector: (sel: string) =>
    sel === "[data-icon]" && icon ? { getAttribute: () => icon } : null,
});
const fakeGroup = (headers: unknown[], values: unknown[]) => ({
  querySelectorAll: (sel: string) =>
    sel.includes("__heading") ? headers : values,
});

test("divar: seller description wins over the publish-date line", () => {
  const root = {
    querySelectorAll: () => [
      fakeText(
        "انتشار آگهی: ۲۵ شهریور ۱۴۰۵، ۱۲:۳۶\nآخرین به‌روز‌رسانی: ۲۵ شهریور ۱۴۰۵، ۱۲:۳۷",
      ),
      fakeText("فایل صد در صد شخصی بنده میباشد\nپارکینگ سندی\nانباری سندی"),
    ],
  };
  const description = parse.descriptionOf(root);
  assert.ok(
    !description.includes("انتشار آگهی"),
    "publish date must be dropped",
  );
  assert.ok(description.includes("صد در صد شخصی"), "seller text must survive");
});

test("divar: blockText keeps newlines but drops runs of spaces", () => {
  const out = parse.blockText(fakeText("  اول   خط  \n\n   خط   دوم  \n"));
  assert.equal(out, "اول خط\nخط دوم");
});

test("divar: descriptionOf falls back to the longest candidate", () => {
  const root = {
    querySelectorAll: () => [
      fakeText("کوتاه"),
      fakeText("بسیار طولانی تر و کامل تر"),
    ],
  };
  assert.equal(parse.descriptionOf(root), "بسیار طولانی تر و کامل تر");
});

test("divar: 'آسانسور ندارد' must not become elevator: true", () => {
  const group = fakeGroup(
    [
      fakeCell("", "elevator", true),
      fakeCell("", "parking"),
      fakeCell("", "cabinet"),
    ],
    [fakeCell("آسانسور ندارد"), fakeCell("پارکینگ"), fakeCell("انباری")],
  );
  const root = {
    querySelectorAll: (sel: string) => (sel === ".kt-group-row" ? [group] : []),
  };
  // deepStrictEqual would compare vm-context prototypes, so check fields.
  const found = parse.amenityTable(root);
  assert.equal(found.elevator, false, "آسانسور ندارد must stay false");
  assert.equal(found.parking, true);
  assert.equal(found.storage, true);
});

test("divar: prose-only negations are respected too", () => {
  assert.equal(parse.hasAmenity("ویژگی‌ها: آسانسور ندارد", "آسانسور"), false);
  assert.equal(parse.hasAmenity("ویژگی‌ها: پارکینگ ندارد", "پارکینگ"), false);
  assert.equal(parse.hasAmenity("ویژگی‌ها: پارکینگ سندی", "پارکینگ"), true);
  assert.equal(parse.hasAmenity("آسانسور، پارکینگ و انباری", "انباری"), true);
  // a later positive mention still wins
  assert.equal(
    parse.hasAmenity("انباری ندارد ولی انباری بزرگ دارد", "انباری"),
    true,
  );
});
