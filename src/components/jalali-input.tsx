"use client";
import { useState } from "react";
import {
  toGregorian,
  toJalaali,
  isValidJalaaliDate,
  jalaaliMonthLength,
} from "jalaali-js";
import { CalendarDays, ChevronRight, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { fa, normalizeDigits } from "@/lib/utils";
const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
export function JalaliInput({ name, value }: { name: string; value: string }) {
  const initial = () => {
    const d = value ? new Date(value) : new Date();
    return toJalaali(Number.isNaN(d.getTime()) ? new Date() : d);
  };
  const [view, setView] = useState(initial);
  const [text, setText] = useState(() => {
    if (!value) return "";
    const j = initial();
    return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(
      2,
      "0",
    )}`;
  });
  const [open, setOpen] = useState(false);
  let iso = "";
  const parts = normalizeDigits(text).split("/").map(Number);
  if (parts.length === 3 && isValidJalaaliDate(parts[0], parts[1], parts[2])) {
    const g = toGregorian(parts[0], parts[1], parts[2]);
    iso = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(
      2,
      "0",
    )}T12:00:00+03:30`;
  }
  const first = toGregorian(view.jy, view.jm, 1);
  const offset = (new Date(first.gy, first.gm - 1, first.gd).getDay() + 1) % 7;
  function move(delta: number) {
    const total = view.jy * 12 + view.jm - 1 + delta;
    setView({ ...view, jy: Math.floor(total / 12), jm: (total % 12) + 1 });
  }
  return (
    <>
      <div className="date-input">
        <input
          id={name}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="۱۴۰۵/۰۷/۰۱"
          inputMode="numeric"
          dir="ltr"
          required
          pattern="[0-9۰-۹]{4}/[0-9۰-۹]{1,2}/[0-9۰-۹]{1,2}"
          aria-invalid={!!text && !iso}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="باز کردن تقویم شمسی"
        >
          <CalendarDays size={18} />
        </button>
      </div>
      <input type="hidden" name={name} value={iso} />
      <small>
        {text && !iso ? "تاریخ شمسی معتبر وارد کنید" : "سال / ماه / روز (شمسی)"}
      </small>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="انتخاب تاریخ شمسی">
          <div className="calendar-navigation">
            <button type="button" onClick={() => move(-1)} aria-label="ماه قبل">
              <ChevronRight size={19} />
            </button>
            <strong>
              {months[view.jm - 1]} {fa(view.jy)}
            </strong>
            <button type="button" onClick={() => move(1)} aria-label="ماه بعد">
              <ChevronLeft size={19} />
            </button>
          </div>
          <div className="calendar-grid">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d, i) => (
              <span className="calendar-weekday" key={i}>
                {d}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from(
              { length: jalaaliMonthLength(view.jy, view.jm) },
              (_, i) => i + 1,
            ).map((day) => (
              <button
                className={
                  parts[0] === view.jy &&
                  parts[1] === view.jm &&
                  parts[2] === day
                    ? "selected"
                    : ""
                }
                type="button"
                key={day}
                onClick={() => {
                  setText(
                    `${view.jy}/${String(view.jm).padStart(2, "0")}/${String(
                      day,
                    ).padStart(2, "0")}`,
                  );
                  setOpen(false);
                }}
              >
                {fa(day)}
              </button>
            ))}
          </div>
          <button
            className="btn btn-outline full-width"
            type="button"
            onClick={() => {
              const now = toJalaali(new Date());
              setView(now);
              setText(
                `${now.jy}/${String(now.jm).padStart(2, "0")}/${String(
                  now.jd,
                ).padStart(2, "0")}`,
              );
              setOpen(false);
            }}
          >
            امروز
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
