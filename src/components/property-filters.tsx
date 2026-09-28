"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "./ui/button";
import { propertyTypes, statuses } from "@/lib/utils";
export function PropertyFilters() {
  const router = useRouter(),
    path = usePathname(),
    params = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(params);
      if (q) p.set("q", q);
      else p.delete("q");
      p.delete("page");
      router.replace(`${path}?${p}`, { scroll: false });
    }, 350);
    return () => clearTimeout(t);
  }, [q, params, path, router]);
  function submit(form: FormData) {
    const p = new URLSearchParams();
    for (const [k, v] of form) if (String(v)) p.set(k, String(v));
    router.push(`${path}?${p}`);
  }
  return (
    <form action={submit} className="filter-panel">
      <div className="filter-top">
        <div className="filter-search">
          <Search size={18} />
          <input
            aria-label="جستجوی فایل‌ها"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی کد فایل، محله، نام مالک…"
          />
        </div>
        <select
          aria-label="وضعیت فایل"
          name="status"
          defaultValue={params.get("status") ?? ""}
        >
          <option value="">همه وضعیت‌ها</option>
          {["ACTIVE", "RENTED", "SOLD", "INACTIVE", "ARCHIVED"].map((s) => (
            <option value={s} key={s}>
              {statuses[s]}
            </option>
          ))}
        </select>
        <select
          aria-label="مرتب‌سازی"
          name="sort"
          defaultValue={params.get("sort") ?? ""}
        >
          <option value="">جدیدترین فایل‌ها</option>
          <option value="price">قیمت کمتر</option>
          <option value="area">متراژ بیشتر</option>
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <SlidersHorizontal size={17} />
          فیلتر پیشرفته
        </Button>
        <Button type="submit" variant="outline">
          اعمال
        </Button>
      </div>
      <div className={`advanced-filters ${expanded ? "expanded" : ""}`}>
        {[
          {
            name: "transactionType",
            label: "نوع معامله",
            options: [
              ["SALE", "فروش"],
              ["RENT", "اجاره"],
            ],
          },
          {
            name: "propertyType",
            label: "نوع ملک",
            options: propertyTypes.map((p) => [p, p]),
          },
        ].map((f) => (
          <div className="field" key={f.name}>
            <label htmlFor={f.name}>{f.label}</label>
            <select
              id={f.name}
              name={f.name}
              defaultValue={params.get(f.name) ?? ""}
            >
              <option value="">همه</option>
              {f.options.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {[
          ["district", "منطقه"],
          ["neighborhood", "محله"],
          ["minArea", "حداقل متراژ"],
          ["maxArea", "حداکثر متراژ"],
          ["bedrooms", "تعداد خواب"],
          ["floor", "طبقه"],
          ["minPrice", "حداقل قیمت فروش"],
          ["maxPrice", "حداکثر قیمت فروش"],
          ["minMortgage", "حداقل رهن"],
          ["maxMortgage", "حداکثر رهن"],
          ["minRent", "حداقل اجاره"],
          ["maxRent", "حداکثر اجاره"],
        ].map(([name, label], i) => (
          <div className="field" key={name}>
            <label htmlFor={name}>{label}</label>
            <input
              id={name}
              name={name}
              type={i > 1 ? "number" : "text"}
              defaultValue={params.get(name) ?? ""}
            />
          </div>
        ))}
        {[
          ["parking", "پارکینگ"],
          ["elevator", "آسانسور"],
          ["isConvertible", "قابل تبدیل"],
        ].map(([name, label]) => (
          <label className="filter-check" key={name}>
            <input
              type="checkbox"
              name={name}
              value="true"
              defaultChecked={params.get(name) === "true"}
            />
            {label}
          </label>
        ))}
      </div>
      {params.size > 0 && (
        <button
          type="button"
          className="clear-filter"
          onClick={() => {
            setQ("");
            router.push(path);
          }}
        >
          <X size={13} />
          پاک کردن فیلترها
        </button>
      )}
    </form>
  );
}
