"use client";
import { useSyncExternalStore } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const noopSubscribe = () => () => {};
const canShareFiles = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.share === "function" &&
  typeof navigator.canShare === "function";
const never = () => false;

export function PropertyShare({
  text,
  imageUrl,
  fileName,
}: {
  text: string;
  imageUrl?: string;
  fileName?: string;
}) {
  const hasNativeShare = useSyncExternalStore(
    noopSubscribe,
    canShareFiles,
    never,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("متن آگهی کپی شد");
    } catch {
      toast.error("کپی نشد؛ متن را دستی انتخاب کنید");
    }
  };

  const shareNative = async () => {
    try {
      if (!imageUrl) {
        await navigator.share({ text });
        return;
      }
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const file = new File([blob], fileName ?? "property.webp", {
        type: blob.type || "image/webp",
      });
      if (navigator.canShare({ files: [file] }))
        await navigator.share({ files: [file], text });
      else await navigator.share({ text });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  };

  return (
    <div className="share-actions">
      <a
        className="btn btn-outline btn-sm"
        target="_blank"
        rel="noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      >
        واتساپ
      </a>
      <a
        className="btn btn-outline btn-sm"
        target="_blank"
        rel="noreferrer"
        href={`https://t.me/share/url?url=${encodeURIComponent(
          imageUrl ?? "",
        )}&text=${encodeURIComponent(text)}`}
      >
        تلگرام
      </a>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        <Copy size={15} />
        کپی متن
      </Button>
      {hasNativeShare && (
        <Button type="button" variant="outline" size="sm" onClick={shareNative}>
          <Share2 size={15} />
          ارسال عکس
        </Button>
      )}
    </div>
  );
}
