import { z } from "zod";
import { normalizeDigits, propertyTypes } from "./utils";
const text = (min = 0, max = 500) =>
  z
    .string()
    .trim()
    .min(min, "این فیلد الزامی است")
    .max(max, "متن بیش از حد طولانی است");
const num = (max = 1e15) =>
  z.preprocess(
    (v) => (typeof v === "string" ? normalizeDigits(v).replaceAll(",", "") : v),
    z.coerce.number().finite().min(0, "مقدار منفی مجاز نیست").max(max),
  );
const integer = (max = 100) =>
  num(max).refine(Number.isInteger, "عدد صحیح وارد کنید");
const bool = z.preprocess(
  (v) => v === true || v === "on" || v === "true",
  z.boolean(),
);
const phone = text(1, 20)
  .transform(normalizeDigits)
  .pipe(z.string().regex(/^0\d{9,10}$/, "شماره تماس معتبر وارد کنید"));
export const ownerSchema = z.object({
  fullName: text(2, 100),
  mobile: phone,
  secondMobile: text(0, 20),
  phone: text(0, 20),
  description: text(0, 5000),
});
export const propertySchema = z
  .object({
    title: text(3, 200),
    ownerId: text(1, 100),
    transactionType: z.enum(["SALE", "RENT"]),
    propertyType: z.enum(propertyTypes),
    status: z.enum(["ACTIVE", "RENTED", "SOLD", "INACTIVE", "ARCHIVED"]),
    city: text(1, 100),
    district: text(0, 100),
    neighborhood: text(1, 100),
    address: text(1, 1000),
    area: num(1e7).refine((v) => v > 0, "متراژ باید بیشتر از صفر باشد"),
    bedrooms: integer(100),
    floor: z.coerce.number().int().min(-10).max(200),
    totalFloors: integer(200),
    unitsPerFloor: integer(200),
    buildingAge: integer(300),
    parking: bool,
    storage: bool,
    elevator: bool,
    balcony: bool,
    salePrice: num(),
    mortgagePrice: num(),
    rentPrice: num(),
    isConvertible: bool,
    description: text(0, 10000),
    internalNotes: text(0, 10000),
  })
  .superRefine((d, ctx) => {
    if (
      (d.transactionType === "SALE" && d.status === "RENTED") ||
      (d.transactionType === "RENT" && d.status === "SOLD")
    )
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: "وضعیت با نوع معامله سازگار نیست",
      });
  });
const date = z.coerce.date();
export const contractSchema = z
  .object({
    propertyId: text(1, 100),
    tenantName: text(2, 100),
    tenantMobile: phone,
    startDate: date,
    endDate: date,
    mortgageAmount: num(),
    rentAmount: num(),
    description: text(0, 5000),
    previousContractId: text(0, 100),
  })
  .refine((d) => d.endDate > d.startDate, {
    path: ["endDate"],
    message: "پایان قرارداد باید بعد از شروع باشد",
  });
export const followUpSchema = z.object({
  propertyId: text(0, 100),
  ownerId: text(0, 100),
  type: z.enum(["CALL", "FOLLOW_UP", "CONTRACT", "OWNER", "OTHER"]),
  note: text(2, 5000),
  followUpDate: date,
});
export const reminderSchema = z.object({
  propertyId: text(0, 100),
  ownerId: text(0, 100),
  title: text(2, 200),
  description: text(0, 5000),
  remindAt: date,
  type: z.enum(["CUSTOM", "CALL", "FOLLOW_UP"]),
});
export const settingsSchema = z.object({
  officeName: text(2, 100),
  officePhone: text(0, 20),
  officeAddress: text(0, 500),
  conversionRate: z.coerce.number().min(0.00001).max(1),
  reminderDays: text(1, 100)
    .transform((v) =>
      normalizeDigits(v)
        .split(/[,،\s]+/)
        .map(Number),
    )
    .refine(
      (v) =>
        v.length <= 12 &&
        v.every((n) => Number.isInteger(n) && n > 0 && n <= 365) &&
        new Set(v).size === v.length,
      "روزها باید اعداد یکتای ۱ تا ۳۶۵ باشند",
    ),
});
