"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, Loader2, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ListingCta({
  token,
  agentName,
  mobile,
  officeName,
}: {
  token: string;
  agentName: string;
  mobile: string;
  officeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const trackPhone = () => {
    const payload = JSON.stringify({ type: "PHONE_CLICK" });
    if (navigator.sendBeacon)
      navigator.sendBeacon(
        `/api/public/listings/${token}`,
        new Blob([payload], { type: "application/json" }),
      );
  };

  const submit = () => {
    setError("");
    start(async () => {
      try {
        const response = await fetch(`/api/public/listings/${token}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, mobile: phone, note }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(body.error || "ثبت درخواست انجام نشد");
        toast.success("درخواست بازدید ثبت شد؛ مشاور با شما تماس می‌گیرد");
        setOpen(false);
        setName("");
        setPhone("");
        setNote("");
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "ثبت درخواست انجام نشد",
        );
      }
    });
  };

  return (
    <div className="listing-cta">
      {mobile && (
        <a
          className="btn btn-primary listing-cta-button"
          href={`tel:${mobile}`}
          onClick={trackPhone}
        >
          <Phone size={17} />
          تماس با مشاور
        </a>
      )}
      <Button
        type="button"
        variant="outline"
        className="listing-cta-button"
        onClick={() => setOpen(true)}
      >
        <CalendarCheck size={17} />
        درخواست بازدید
      </Button>
      {mobile && (
        <a
          className="btn btn-outline listing-cta-button"
          href={`https://wa.me/${mobile.replace(/^0/, "98")}`}
          target="_blank"
          rel="noreferrer"
          onClick={trackPhone}
        >
          <MessageCircle size={17} />
          واتساپ
        </a>
      )}
      {agentName && (
        <p className="listing-agent">
          مشاور: <strong>{agentName}</strong>
          {officeName ? ` · ${officeName}` : ""}
        </p>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="درخواست بازدید">
          <form
            className="record-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label>
              نام شما
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
              />
            </label>
            <label>
              شماره موبایل
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="tel"
                dir="ltr"
                placeholder="09121234567"
              />
            </label>
            <label>
              توضیح کوتاه (اختیاری)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </label>
            {error && <p className="field-error">{error}</p>}
            <div className="form-footer">
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="spin" size={16} /> : <CalendarCheck size={16} />}
                ثبت درخواست
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                انصراف
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
