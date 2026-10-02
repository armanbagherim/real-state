import type { AdCopyVariant } from "@prisma/client";
import { fa } from "@/lib/utils";

/**
 * Facts the generator is allowed to use. Mirrors what actually exists on the
 * property row — nothing here is inferred, defaulted, or embellished.
 */
export type AdCopyInput = {
  transactionType: "RENT" | "SALE";
  propertyType: string;
  area: number;
  bedrooms: number;
  floor: number;
  totalFloors: number;
  unitsPerFloor: number;
  buildingAge: number;
  parking: boolean;
  storage: boolean;
  elevator: boolean;
  balcony: boolean;
  salePrice: number;
  mortgagePrice: number;
  rentPrice: number;
  city: string;
  district: string;
  neighborhood: string;
  description: string;
  hasImages: boolean;
  agentName: string;
  /** Iranian solar year the building age is measured against. */
  currentYear?: number;
};

export interface AdCopyGenerator {
  /** Stable id persisted on the row so a saved copy can be traced to its source. */
  readonly id: string;
  generate(input: AdCopyInput, variant: AdCopyVariant): Promise<string>;
}

const IRANIAN_THIS_YEAR = 1405;

/** Only lines backed by a real field are allowed to appear. */
const amenityLines = (input: AdCopyInput) => {
  const lines: string[] = [];
  if (input.elevator) lines.push("آسانسور: ✅ دارد");
  if (input.parking) lines.push("پارکینگ: ✅ دارد");
  if (input.storage) lines.push("انباری: ✅ دارد");
  if (input.balcony) lines.push("بالکن: ✅ دارد");
  return lines;
};

/**
 * Picks the single strongest verifiable trait and frames it as a hook. Ordered
 * by how reliably the trait reads in a listing, and every branch maps to a real
 * boolean/number — no invented amenities, no superlatives.
 */
function hookFor(input: AdCopyInput): string {
  if (input.elevator && input.floor > 0 && input.floor >= input.totalFloors - 1)
    return "اگه طبقه آخر براتون مهمه، از این آگهی رد بشید!";
  if (input.balcony && input.area >= 80)
    return "اگه دنبال بالکنی هستید که واقعاً به اندازه یه اتاق جا داشته باشه، این یکی رو ببینید!";
  if (input.parking && input.storage)
    return "اگه پارکینگ سندی و انباری براتون واجبه، این آگهی رو از دست ندید!";
  if (input.unitsPerFloor <= 2)
    return "این واحد رو بیشتر برای کسی پیشنهاد می‌کنم که واحدِ کم‌جمعیت و آروم براش مهمه.";
  if (input.balcony) return "اگه بالکن براتون اولویت اوله، این آگهی رو ببینید!";
  if (input.elevator) return "اگه ساختمانی می‌خواید که آسانسورش راه‌انداز و راحت باشه، اینو ببینید!";
  if (input.parking) return "اگه پارکینگ براتون مهمه، از این آگهی رد نشید!";
  if (input.bedrooms >= 3)
    return "اگه دنبال واحدی با تعداد خواب بالا هستید، این آگهی رو ببینید!";
  if (input.area >= 100)
    return "اگه متراژ براتون مهمه، این واحد رو از دست ندید!";
  // Only claim good location when a location actually exists on the record.
  if (locationLine(input))
    return "این واحد رو بیشتر برای کسی پیشنهاد می‌کنم که موقعیت و دسترسی خوب براش اولویت داره.";
  return "این واحد رو بیشتر برای کسی پیشنهاد می‌کنم که متراژ و تعداد خوابش براش مهمه.";
}

/** Everything we can assert about the unit itself. Absent facts are skipped. */
function interiorLines(input: AdCopyInput): string[] {
  const lines: string[] = [`**${fa(input.area)} متر**`];
  if (input.bedrooms > 0) lines.push(`**${fa(input.bedrooms)} خواب**`);
  if (input.floor > 0) lines.push(`طبقه ${fa(input.floor)}`);
  if (input.unitsPerFloor > 0 && input.unitsPerFloor <= 2)
    lines.push(`**واحد در طبقه: ${fa(input.unitsPerFloor)}**`);
  const year = (input.currentYear ?? IRANIAN_THIS_YEAR) - input.buildingAge;
  // Years are calendar years, not quantities: format without grouping.
  if (input.buildingAge > 0) lines.push(`ساخت ${year.toLocaleString("fa-IR", { useGrouping: false })}`);
  return lines;
}

function locationLine(input: AdCopyInput): string {
  const parts = [input.neighborhood, input.district, input.city].filter(Boolean);
  const unique = parts.filter((part, i) => parts.indexOf(part) === i);
  return unique.join("، ");
}

function priceLines(input: AdCopyInput): string[] {
  if (input.transactionType === "SALE")
    return input.salePrice > 0 ? [`■ **قیمت: ${fa(input.salePrice)} تومان**`] : [];
  const lines: string[] = [];
  if (input.mortgagePrice > 0 && input.rentPrice > 0) {
    lines.push(`■ **رهن: ${fa(input.mortgagePrice)} تومان**`);
    lines.push(`■ **اجاره: ${fa(input.rentPrice)} تومان**`);
  } else if (input.mortgagePrice > 0) {
    lines.push(`■ **رهن کامل: ${fa(input.mortgagePrice)} تومان**`);
  } else if (input.rentPrice > 0) {
    lines.push(`■ **اجاره: ${fa(input.rentPrice)} تومان**`);
  }
  return lines;
}

const SECTION_INTERIOR = "▪︎▪︎▪︎ **توضیحات داخل واحد** ▪︎▪︎▪︎";
const SECTION_BUILDING = "▪︎▪︎▪︎ **توضیحات ساختمان و موقعیت** ▪︎▪︎▪︎";

/**
 * Builds the ad from verified fields only. Every section is dropped when we
 * have nothing real to put in it, rather than padded with filler.
 */
export function composeAdCopy(input: AdCopyInput, variant: AdCopyVariant): string {
  const agent = input.agentName.trim();
  const closing = agent ? `**مشاور شما، ${agent}**` : "";

  if (variant === "WHATSAPP")
    return buildWhatsapp(input, closing);
  if (variant === "INSTAGRAM") return buildInstagram(input, closing);
  if (variant === "CUSTOMER") return buildCustomer(input, closing);
  return buildDivar(input, closing);
}

function buildDivar(input: AdCopyInput, closing: string): string {
  const parts: string[] = [hookFor(input)];
  const location = locationLine(input);
  // Price is its own block: it is not part of "building and location", and
  // keeping it out means that section only appears when we really have
  // location or amenity data.
  const building = [location ? `■ **${location}**` : "", ...amenityLines(input)].filter(
    Boolean,
  );
  const price = priceLines(input);

  const interior = interiorLines(input);
  if (interior.length)
    parts.push(SECTION_INTERIOR, ...interior.map((line) => `■ ${line}`));
  if (building.length) parts.push(SECTION_BUILDING, ...building);
  if (price.length) parts.push(...price);

  const tail = [
    input.hasImages
      ? "**عکس‌های آگهی واقعی و مربوط به خود ملک هستند.**"
      : "",
    "برای اطلاعات بیشتر و هماهنگی بازدید تماس بگیرید.",
    closing,
  ].filter(Boolean);
  parts.push(tail.join("\n"));
  return parts.join("\n\n");
}

/** Short, direct, meant to be pasted into a chat window. */
function buildWhatsapp(input: AdCopyInput, closing: string): string {
  const specs = [
    `${fa(input.area)} متر`,
    input.bedrooms > 0 ? `${fa(input.bedrooms)} خواب` : "",
    input.floor > 0 ? `طبقه ${fa(input.floor)}` : "",
  ].filter(Boolean);
  const lines = [
    `${input.propertyType} ${specs.join(" | ")}`,
    locationLine(input),
    ...priceLines(input).map((l) => l.replace("■ ", "")),
    amenityLines(input).map((l) => l.replace(": ✅ دارد", "")),
    input.description.trim() ? input.description.trim().slice(0, 400) : "",
    "برای هماهنگی بازدید تماس بگیرید.",
    closing,
  ].filter(Boolean);
  return lines.join("\n");
}

/** Lede-heavy, few specs, room for the hook to land. */
function buildInstagram(input: AdCopyInput, closing: string): string {
  const specs = [
    `${fa(input.area)} متر`,
    input.bedrooms > 0 ? `${fa(input.bedrooms)} خواب` : "",
    input.floor > 0 ? `طبقه ${fa(input.floor)}` : "",
    ...amenityLines(input).map((l) => l.replace(": ✅ دارد", "")),
  ].filter(Boolean);
  return [
    hookFor(input),
    locationLine(input),
    specs.join(" · "),
    ...priceLines(input).map((l) => l.replace("■ ", "")),
    input.description.trim() ? input.description.trim().slice(0, 220) : "",
    closing,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Client-facing: what the buyer cares about, with a clear call to action. */
function buildCustomer(input: AdCopyInput, closing: string): string {
  return [
    `${input.propertyType} ${fa(input.area)} متری${input.bedrooms > 0 ? ` با ${fa(input.bedrooms)} خواب` : ""}`,
    locationLine(input),
    [
      input.floor > 0 ? `طبقه ${fa(input.floor)}` : "",
      input.buildingAge > 0
        ? `ساخت ${fa((input.currentYear ?? IRANIAN_THIS_YEAR) - input.buildingAge)}`
        : "",
      ...amenityLines(input).map((l) => l.replace(": ✅ دارد", "")),
    ]
      .filter(Boolean)
      .join(" | "),
    ...priceLines(input).map((l) => l.replace("■ ", "")),
    input.description.trim() ? input.description.trim().slice(0, 600) : "",
    "برای بازدید و هماهنگی، با مشاور تماس بگیرید.",
    closing,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Default provider. Runs fully server-side with no API key, so ad generation
 * works out of the box; swap in a model-backed provider later without touching
 * the callers.
 */
export const templateGenerator: AdCopyGenerator = {
  id: "ashian-template-v1",
  async generate(input, variant) {
    return composeAdCopy(input, variant);
  },
};
