"use client";

import { useEffect, useState } from "react";
import type { PublicProperty } from "@/lib/public-property";
import { fa, shortMoney } from "@/lib/utils";
import { Building2, CalendarDays } from "lucide-react";

export function ListingStats({ p }: { p: PublicProperty }) {
  const specs = [
    `${fa(p.area)} متر`,
    p.bedrooms > 0 ? `${fa(p.bedrooms)} خواب` : "",
    p.floor > 0 ? `طبقه ${fa(p.floor)}` : "",
    p.buildingAge > 0 ? `ساخت ${fa(1405 - p.buildingAge)}` : "",
  ].filter(Boolean);
  const location = [p.neighborhood, p.district, p.city]
    .filter(Boolean)
    .filter((part, i, all) => all.indexOf(part) === i)
    .join("، ");
  return (
    <div className="listing-summary">
      <h1 className="listing-title">{p.title}</h1>
      {location && <p className="listing-location">{location}</p>}
      <p className="listing-specs">{specs.join(" | ")}</p>
    </div>
  );
}

export function ListingPrices({ p }: { p: PublicProperty }) {
  return (
    <div className="listing-prices">
      {p.transactionType === "SALE" ? (
        p.salePrice > 0 ? (
          <div className="listing-price">
            <span>قیمت</span>
            <strong>{shortMoney(p.salePrice)} تومان</strong>
          </div>
        ) : null
      ) : (
        <>
          {p.mortgagePrice > 0 && (
            <div className="listing-price">
              <span>رهن</span>
              <strong>{shortMoney(p.mortgagePrice)} تومان</strong>
            </div>
          )}
          {p.rentPrice > 0 && (
            <div className="listing-price">
              <span>اجاره ماهانه</span>
              <strong>{shortMoney(p.rentPrice)} تومان</strong>
            </div>
          )}
        </>
      )}
      {!p.salePrice && !p.mortgagePrice && !p.rentPrice && (
        <div className="listing-price">
          <span>قیمت</span>
          <strong>تماس بگیرید</strong>
        </div>
      )}
    </div>
  );
}

export function ListingAmenities({ p }: { p: PublicProperty }) {
  const items = [
    { has: p.elevator, label: "آسانسور" },
    { has: p.parking, label: "پارکینگ" },
    { has: p.storage, label: "انباری" },
    { has: p.balcony, label: "بالکن" },
  ].filter((item) => item.has);
  if (!items.length) return null;
  return (
    <div className="listing-amenities">
      {items.map(({ label }) => (
        <span key={label}>✅ {label}</span>
      ))}
    </div>
  );
}

export function ListingDescription({ p }: { p: PublicProperty }) {
  if (!p.description.trim()) return null;
  return (
    <section className="listing-block">
      <h2>توضیحات</h2>
      <p className="preserve-space listing-description">{p.description}</p>
    </section>
  );
}

/** Records page views and gallery taps. Failures never surface to the visitor. */
export function ListingTracker({
  token,
  hasImages,
}: {
  token: string;
  hasImages: boolean;
}) {
  useEffect(() => {
    const beacon = (type: "VIEW" | "GALLERY") => {
      const payload = JSON.stringify({ type });
      // sendBeacon survives the page going away; fetch is the fallback.
      if (navigator.sendBeacon)
        navigator.sendBeacon(
          `/api/public/listings/${token}`,
          new Blob([payload], { type: "application/json" }),
        );
      else
        fetch(`/api/public/listings/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
    };
    beacon("VIEW");
    if (!hasImages) return;
    const onGallery = () => beacon("GALLERY");
    window.addEventListener("ashian:gallery", onGallery);
    return () => window.removeEventListener("ashian:gallery", onGallery);
  }, [token, hasImages]);
  return null;
}

export function ListingGallery({ p }: { p: PublicProperty }) {
  const [index, setIndex] = useState(0);
  if (!p.images.length)
    return (
      <div className="listing-gallery listing-gallery-empty">
        <Building2 size={56} />
        <span>تصویری برای این ملک ثبت نشده است</span>
      </div>
    );
  const at = Math.min(index, p.images.length - 1);
  return (
    <div className="listing-gallery">
      <img
        src={p.images[at]!.url}
        alt={`${p.title} - ${fa(at + 1)}`}
        width={900}
        height={600}
        onTouchStart={(e) => {
          const start = e.touches[0]!.clientX;
          const onEnd = (end: TouchEvent) => {
            const delta = end.changedTouches[0]!.clientX - start;
            if (Math.abs(delta) > 45)
              setIndex((i) =>
                (i + (delta > 0 ? -1 : 1) + p.images.length) % p.images.length,
              );
          };
          document.addEventListener("touchend", onEnd, { once: true });
        }}
      />
      {p.images.length > 1 && (
        <>
          <div className="listing-gallery-count" dir="ltr">
            {fa(at + 1)} / {fa(p.images.length)}
          </div>
          <button
            type="button"
            className="listing-gallery-prev"
            aria-label="تصویر قبلی"
            onClick={() => setIndex((i) => (i - 1 + p.images.length) % p.images.length)}
          >
            ›
          </button>
          <button
            type="button"
            className="listing-gallery-next"
            aria-label="تصویر بعدی"
            onClick={() => setIndex((i) => (i + 1) % p.images.length)}
          >
            ‹
          </button>
        </>
      )}
    </div>
  );
}

export function ListingMeta({ p }: { p: PublicProperty }) {
  return (
    <p className="listing-meta">
      <CalendarDays size={14} />
      ثبت‌شده در {new Intl.DateTimeFormat("fa-IR", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(new Date(p.createdAt))}
    </p>
  );
}
