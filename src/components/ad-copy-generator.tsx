"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Pencil, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  generateAdCopyAction,
  saveAdCopyAction,
  type ListingActionResult,
} from "@/actions/listings";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const empty: ListingActionResult = {};

const VARIANTS = [
  { value: "DIVAR", label: "دیوار (کامل)" },
  { value: "INSTAGRAM", label: "اینستاگرام" },
  { value: "WHATSAPP", label: "واتساپ" },
  { value: "CUSTOMER", label: "ارسال به مشتری" },
] as const;

/**
 * Generates ad copy from the property's real data. The agent can regenerate,
 * edit, copy and save; nothing is persisted until they hit save.
 */
export function AdCopyGenerator({
  propertyId,
  initialCopies,
  size = "default",
}: {
  propertyId: string;
  initialCopies?: {
    variant: string;
    content: string;
    generator: string;
    editedByUser: boolean;
  }[];
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<string>("DIVAR");
  const [editing, setEditing] = useState(false);
  // Typed text wins over the last generation; `null` means "nothing typed yet".
  const [typed, setTyped] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState("");
  const [savedSignature, setSavedSignature] = useState("");

  const [state, action, pending] = useActionState(generateAdCopyAction, empty);
  const [saveState, saveAction, saving] = useActionState(
    saveAdCopyAction,
    empty,
  );

  const generated = state.content ?? "";
  const generator = state.generator ?? "";
  const draft = typed ?? generated;

  // Render-phase adjustments: a newer generation supersedes manual edits, and a
  // successful save closes the dialog. React allows these during render, and
  // they avoid a cascading setState from an effect.
  if (generated && generated !== lastGenerated) {
    setLastGenerated(generated);
    setTyped(null);
  }
  if (saveState.success && saveState.success !== savedSignature) {
    setSavedSignature(saveState.success);
    toast.success(saveState.success);
    setOpen(false);
  }

  const saved = initialCopies?.find((copy) => copy.variant === variant);
  // Entering the editor is a pure UI toggle; leaving it keeps whatever was typed.
  const toggleEditing = () => setEditing((value) => !value);

  const runGenerate = () => {
    const form = new FormData();
    form.set("propertyId", propertyId);
    form.set("variant", variant);
    action(form);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => setOpen(true)}
      >
        <Sparkles size={size === "sm" ? 15 : 17} />
        تولید آگهی
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="تولید متن آگهی">
          <div className="ad-copy">
            <div className="ad-copy-bar">
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                aria-label="نوع آگهی"
              >
                {VARIANTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                onClick={runGenerate}
                disabled={pending}
              >
                {pending ? (
                  <RefreshCw className="spin" size={15} />
                ) : (
                  <Sparkles size={15} />
                )}
                {pending ? "در حال آماده‌سازی..." : "تولید"}
              </Button>
            </div>
            <p className="muted-note">
              متن فقط از اطلاعات ثبت‌شده همین ملک ساخته می‌شود؛ هیچ ویژگی‌ای که
              در فایل ثبت نشده باشد به متن اضافه نمی‌شود.
            </p>

            {!draft ? (
              saved?.content ? (
                <div className="ad-copy-preview">
                  <pre>{saved.content}</pre>
                  {saved.editedByUser && (
                    <p className="muted">نسخه ذخیره‌شده (ویرایش‌شده)</p>
                  )}
                </div>
              ) : (
                <p className="muted">
                  روی «تولید» بزنید تا متن آگهی از اطلاعات ملک ساخته شود.
                </p>
              )
            ) : editing ? (
              <textarea
                value={draft}
                onChange={(e) => setTyped(e.target.value)}
                rows={16}
                className="ad-copy-editor"
                dir="rtl"
              />
            ) : (
              <div className="ad-copy-preview">
                <pre>{draft}</pre>
              </div>
            )}

            {saveState.error && (
              <p className="field-error">{saveState.error}</p>
            )}

            <div className="form-footer">
              <Button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(draft);
                  toast.success("متن آگهی کپی شد");
                }}
                disabled={!draft}
              >
                <Copy size={15} />
                کپی متن
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={toggleEditing}
                disabled={!draft}
              >
                {editing ? <Check size={15} /> : <Pencil size={15} />}
                {editing ? "پایان ویرایش" : "ویرایش"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={runGenerate}
                disabled={pending}
              >
                <RefreshCw size={15} />
                بازسازی
              </Button>
              <form action={saveAction} className="ad-copy-save">
                <input type="hidden" name="propertyId" value={propertyId} />
                <input type="hidden" name="variant" value={variant} />
                <input type="hidden" name="content" value={draft} />
                <input type="hidden" name="generator" value={generator} />
                <Button type="submit" disabled={!draft || saving}>
                  <Save size={15} />
                  ذخیره
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
