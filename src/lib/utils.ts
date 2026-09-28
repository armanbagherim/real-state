import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const fa = (n: number | string) =>
  new Intl.NumberFormat("fa-IR").format(Number(n));
export const dateFa = (d: Date | string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeZone: "Asia/Tehran",
  }).format(new Date(d));
export const money = (n: number | string) => `${fa(n)} تومان`;
export const shortMoney = (value: number | string) => {
  const n = Number(value);
  return n >= 1e9
    ? `${fa(Math.round(n / 1e8) / 10)} میلیارد`
    : n >= 1e6
    ? `${fa(Math.round(n / 1e5) / 10)} میلیون`
    : fa(n);
};
export const normalizeDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
export const statuses: Record<string, string> = {
  ACTIVE: "فعال",
  RENTED: "اجاره‌رفته",
  SOLD: "فروش‌رفته",
  INACTIVE: "غیرفعال",
  ARCHIVED: "آرشیو",
  PENDING: "در انتظار",
  COMPLETED: "انجام‌شده",
  CANCELLED: "لغوشده",
  DISMISSED: "بسته‌شده",
  EXPIRED: "پایان‌یافته",
  RENEWED: "تمدید‌شده",
};
export const propertyTypes = [
  "آپارتمان",
  "خانه",
  "ویلا",
  "مغازه",
  "دفتر",
  "زمین",
  "کلنگی",
  "انبار",
  "سایر",
];
export function tehranDayRange(now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const start = new Date(`${day}T00:00:00+03:30`);
  return { start, end: new Date(start.getTime() + 86400000) };
}
