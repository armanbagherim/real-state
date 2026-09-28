"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
export function ImageUploader({ propertyId }: { propertyId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <label className="upload-button">
      {busy ? <Loader2 className="spin" size={18} /> : <ImagePlus size={18} />}{" "}
      {busy ? "در حال بارگذاری…" : "افزودن تصاویر"}
      <input
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          setBusy(true);
          try {
            for (const file of files) {
              const body = new FormData();
              body.set("propertyId", propertyId);
              body.set("file", file);
              const response = await fetch("/api/uploads", {
                method: "POST",
                body,
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error);
            }
            toast.success("تصاویر ذخیره شدند");
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "خطا در بارگذاری",
            );
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </label>
  );
}
