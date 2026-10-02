"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPublicLink,
  disablePublicLink,
  savePublicLinkSettings,
  type ListingActionResult,
} from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { fa } from "@/lib/utils";

const empty: ListingActionResult = {};

/**
 * Creates the shareable customer link, then offers copy and the native share
 * sheet (WhatsApp/Telegram on mobile). The server returns the token, which is
 * rendered straight away rather than being mirrored into state.
 */
export function PublicLinkCard({
  propertyId,
  initialToken,
  showAddressDefault = false,
  stats,
}: {
  propertyId: string;
  initialToken?: string;
  showAddressDefault?: boolean;
  stats?: { views: number; phoneClicks: number; visitRequests: number };
}) {
  const [state, action, pending] = useActionState(createPublicLink, empty);
  const [showAddress, setShowAddress] = useState(showAddressDefault);
  const [showPhone, setShowPhone] = useState(true);
  const [copied, setCopied] = useState(false);
  // A fresh link replaces the old one until the page is reloaded.
  const token = state.token ?? initialToken ?? "";
  const url = token ? buildUrl(token) : "";

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("لینک ملک کپی شد ✓");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی نشد؛ لینک را دستی انتخاب کنید");
    }
  };

  const share = async () => {
    if (!url || typeof navigator.share !== "function") return;
    try {
      await navigator.share({ title: "مشاهده ملک", url });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  };

  return (
    <section className="panel detail-panel listing-link-panel">
      <div className="row-between">
        <h2>اشتراک‌گذاری برای مشتری</h2>
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "کپی شد" : "کپی لینک"}
          </Button>
        )}
      </div>
      <p className="muted">
        یک لینک اختصاصی بسازید تا مشتری بدون ورود به حساب، ملک را ببیند.
      </p>

      {!url ? (
        <form action={action} className="listing-link-form">
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="showAddress" value={String(showAddress)} />
          <input type="hidden" name="showPhone" value={String(showPhone)} />
          <label className="filter-check">
            <input
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
            />
            نمایش شماره تماس مشاور
          </label>
          <label className="filter-check">
            <input
              type="checkbox"
              checked={showAddress}
              onChange={(e) => setShowAddress(e.target.checked)}
            />
            نمایش نشانی دقیق (می‌تواند ملک را لو بدهد)
          </label>
          {state.error && <p className="field-error">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Link2 size={16} />
            )}
            ساخت لینک مشتری
          </Button>
        </form>
      ) : (
        <div className="listing-link-ready">
          <code dir="ltr">{url}</code>
          <div className="row-gap">
            <Button type="button" variant="outline" size="sm" onClick={share}>
              اشتراک‌گذاری
            </Button>
            <a
              className="btn btn-outline btn-sm"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              باز کردن صفحه
            </a>
          </div>
          {stats && (
            <p className="muted listing-link-stats">
              {fa(stats.views)} بازدید · {fa(stats.phoneClicks)} تماس ·{" "}
              {fa(stats.visitRequests)} درخواست بازدید
            </p>
          )}
          <LinkSettings propertyId={propertyId} token={token} />
        </div>
      )}
    </section>
  );
}

function buildUrl(token: string) {
  return typeof window === "undefined"
    ? `/p/${token}`
    : `${window.location.origin}/p/${token}`;
}

function LinkSettings({
  propertyId,
  token,
}: {
  propertyId: string;
  token: string;
}) {
  const [state, action, pending] = useActionState(savePublicLinkSettings, empty);
  const [disableState, disableAction, disabling] = useActionState(
    disablePublicLink,
    empty,
  );
  const message =
    state.success ||
    disableState.success ||
    state.error ||
    disableState.error ||
    "";

  return (
    <div className="listing-link-settings">
      <form action={action} className="row-gap">
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="isActive" value="true" />
        <label className="filter-check">
          <input type="checkbox" name="showPhone" value="true" defaultChecked />
          شماره تماس نمایش داده شود
        </label>
        <label className="filter-check">
          <input type="checkbox" name="showAddress" value="true" />
          نشانی نمایش داده شود
        </label>
        <Button type="submit" variant="ghost" size="sm" disabled={pending}>
          ذخیره
        </Button>
      </form>
      <form action={disableAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={disabling}
        >
          غیرفعال کردن لینک
        </Button>
      </form>
      {message && <p className="muted">{message}</p>}
      <p className="muted">توکن: {token}</p>
    </div>
  );
}