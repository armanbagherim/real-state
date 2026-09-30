"use client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { fa, wrapIndex } from "@/lib/utils";
import { Dialog as Root, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function PropertyGallery({
  images,
  title,
  canDelete = false,
}: {
  images: { id: string; url: string }[];
  title: string;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const startX = useRef(0);
  const dragX = useRef(0);
  const strip = useRef<HTMLDivElement>(null);

  const nudge = (dir: number) => {
    const el = strip.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.max(200, el.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : wrapIndex(i, delta, images.length))),
    [images.length],
  );

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/uploads/${pending}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error((await response.json()).error ?? "خطا در حذف");
      setPending(null);
      toast.success("تصویر حذف شد");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "حذف تصویر انجام نشد",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!images.length) {
    return (
      <div className="property-gallery">
        <div className="gallery-strip">
          <div className="gallery-empty">
            <Building2 size={64} />
            <span>تصاویر این ملک را اضافه کنید</span>
          </div>
        </div>
      </div>
    );
  }

  const at = Math.min(index ?? 0, images.length - 1);
  const current = images[at];

  return (
    <div className="property-gallery">
      <div
        className="gallery-strip"
        ref={strip}
        tabIndex={0}
        role="group"
        aria-label={`تصاویر ${title}`}
      >
        {images.map((img, i) => (
          <div className="gallery-item" key={img.id}>
            <button type="button" onClick={() => setIndex(i)}>
              <img
                src={img.url}
                alt={`${title} - ${fa(i + 1)}`}
                width={500}
                height={300}
              />
            </button>
            {canDelete && (
              <button
                type="button"
                className="gallery-remove"
                aria-label={`حذف تصویر ${fa(i + 1)}`}
                onClick={() => setPending(img.id)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="gallery-nav gallery-nav--prev"
        aria-label="تصاویر قبلی"
        onClick={() => nudge(-1)}
      >
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        className="gallery-nav gallery-nav--next"
        aria-label="تصاویر بعدی"
        onClick={() => nudge(1)}
      >
        <ChevronLeft size={18} />
      </button>
      <Root
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <DialogContent title="حذف تصویر">
          <p className="muted">
            این تصویر برای همیشه از فایل حذف می‌شود. مطمئن هستید؟
          </p>
          <div className="form-footer">
            <Button variant="destructive" onClick={remove} disabled={busy}>
              حذف تصویر
            </Button>
            <Button variant="outline" onClick={() => setPending(null)}>
              انصراف
            </Button>
          </div>
        </DialogContent>
      </Root>
      <Dialog.Root
        open={index !== null}
        onOpenChange={(open) => !open && setIndex(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="lightbox-overlay" />
          <Dialog.Content
            className="lightbox"
            aria-describedby={undefined}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                go(1);
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                go(-1);
              }
            }}
          >
            <Dialog.Title className="sr-only">تصاویر {title}</Dialog.Title>
            <Dialog.Close
              className="lightbox-close btn btn-ghost btn-icon"
              aria-label="بستن"
            >
              <X size={20} />
            </Dialog.Close>
            <div
              className="lightbox-stage"
              onPointerDown={(e) => {
                startX.current = e.clientX;
                dragX.current = 0;
                setOffset(0);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                dragX.current = e.clientX - startX.current;
                setOffset(dragX.current);
              }}
              onPointerUp={() => {
                if (Math.abs(dragX.current) > 60) {
                  go(dragX.current > 0 ? 1 : -1);
                }
                setOffset(0);
              }}
              onClick={() => {
                if (Math.abs(dragX.current) <= 10) setIndex(null);
              }}
            >
              <img
                key={current.id}
                className="lightbox-image"
                src={current.url}
                alt={`${title} - ${fa(at + 1)}`}
                draggable={false}
                style={{
                  transform: offset ? `translateX(${offset}px)` : undefined,
                  transition: offset ? "none" : "transform .18s",
                }}
              />
            </div>
            <div className="lightbox-bar">
              <button
                type="button"
                className="lightbox-nav"
                aria-label="تصویر قبلی"
                onClick={() => go(-1)}
              >
                <ChevronRight size={22} />
              </button>
              <span className="lightbox-count" dir="ltr">
                {fa(at + 1)} / {fa(images.length)}
              </span>
              <button
                type="button"
                className="lightbox-nav"
                aria-label="تصویر بعدی"
                onClick={() => go(1)}
              >
                <ChevronLeft size={22} />
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
