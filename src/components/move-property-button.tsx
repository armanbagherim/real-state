"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Folder,
  FolderInput,
  FolderPlus,
  FolderX,
} from "lucide-react";
import { movePropertyToFolder } from "@/actions/folders";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import type { FolderOption } from "./folder-select";
import { groupByDepth, type OptionNode } from "@/lib/folder-tree";

const empty = {};

/**
 * Radio-style folder tree. A `<select>` cannot show nesting or highlight where
 * the file already sits, so the picker renders the real tree instead.
 */
export function MovePropertyButton({
  propertyId,
  currentFolderId,
  folders,
  size = "sm",
  label = "پوشه",
}: {
  propertyId: string;
  currentFolderId?: string | null;
  folders: FolderOption[];
  size?: "sm" | "default";
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(currentFolderId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const tree = useMemo(() => groupByDepth(folders), [folders]);
  const current = folders.find((f) => f.id === currentFolderId);

  function toggle(id: string) {
    setCollapsed((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function submit() {
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("propertyId", propertyId);
    form.set("folderId", picked);
    const result = await movePropertyToFolder(empty, form);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => {
          setPicked(currentFolderId ?? "");
          setError("");
          setOpen(true);
        }}
        title={current ? `پوشه فعلی: ${current.path}` : "انتقال به پوشه"}
      >
        <FolderInput size={size === "sm" ? 15 : 17} />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="انتقال فایل به پوشه">
          <div className="folder-picker">
            <div className="folder-picker-current">
              <span>پوشه فعلی</span>
              {current ? (
                <span
                  className="folder-cell"
                  style={
                    { "--folder-color": current.color } as React.CSSProperties
                  }
                >
                  <Folder size={13} />
                  {current.path}
                </span>
              ) : (
                <span className="folder-cell folder-cell-empty">
                  <FolderX size={13} />
                  بدون پوشه
                </span>
              )}
            </div>

            <div
              className="folder-picker-tree"
              role="radiogroup"
              aria-label="پوشه مقصد"
            >
              <PickerOption
                name="بدون پوشه"
                picked={picked === ""}
                onPick={() => setPicked("")}
                icon={<FolderX size={15} />}
                className="folder-picker-empty"
              />
              {tree.map((node) => (
                <PickerNode
                  key={node.id}
                  node={node}
                  picked={picked}
                  onPick={setPicked}
                  collapsed={collapsed}
                  onToggle={toggle}
                />
              ))}
              {!tree.length && (
                <p className="muted-note">هنوز پوشه‌ای نساخته‌اید.</p>
              )}
            </div>

            {error && <p className="field-error">{error}</p>}
            <div className="form-footer">
              <Button type="button" onClick={submit} disabled={pending}>
                <FolderInput size={16} />
                {pending ? "در حال انتقال…" : "انتقال فایل"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                انصراف
              </Button>
              <Button asChild variant="ghost" className="folder-picker-manage">
                <Link href="/folders">
                  <FolderPlus size={15} /> مدیریت پوشه‌ها
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PickerNode({
  node,
  picked,
  onPick,
  collapsed,
  onToggle,
}: {
  node: OptionNode<FolderOption>;
  picked: string;
  onPick: (id: string) => void;
  collapsed: string[];
  onToggle: (id: string) => void;
}) {
  const isCollapsed = collapsed.includes(node.id);
  return (
    <div className="folder-picker-branch">
      <div className="folder-picker-line">
        <button
          type="button"
          className="folder-picker-chevron"
          aria-label={
            isCollapsed ? "نمایش زیرپوشه‌ها" : "پنهان کردن زیرپوشه‌ها"
          }
          aria-expanded={!isCollapsed}
          disabled={!node.children.length}
          onClick={() => onToggle(node.id)}
        >
          {node.children.length ? (
            <ChevronDown
              size={14}
              style={{
                transform: isCollapsed ? "rotate(-90deg)" : "none",
                transition: "transform .15s ease",
              }}
            />
          ) : null}
        </button>
        <PickerOption
          name={node.name}
          picked={picked === node.id}
          onPick={() => onPick(node.id)}
          icon={<Folder size={15} />}
          color={node.color}
        />
      </div>
      {!isCollapsed &&
        node.children.map((child) => (
          <PickerNode
            key={child.id}
            node={child}
            picked={picked}
            onPick={onPick}
            collapsed={collapsed}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

function PickerOption({
  name,
  picked,
  onPick,
  icon,
  color,
  className,
}: {
  name: string;
  picked: boolean;
  onPick: () => void;
  icon: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={picked}
      className={`folder-picker-option${picked ? " picked" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={
        color ? ({ "--folder-color": color } as React.CSSProperties) : undefined
      }
      onClick={onPick}
    >
      {icon}
      <span>{name}</span>
    </button>
  );
}
