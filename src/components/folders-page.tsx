"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderOpen, FolderPlus, Inbox } from "lucide-react";
import { toast } from "sonner";
import { createFolder } from "@/actions/folders";
import { Button } from "./ui/button";
import { FolderTree } from "./folder-tree";
import type { FolderOption } from "./folder-select";
import type { FolderNode } from "@/lib/folder-tree";
import { fa } from "@/lib/utils";

export function FoldersPage({
  nodes,
  options,
  unfiledCount,
}: {
  nodes: FolderNode[];
  options: FolderOption[];
  unfiledCount: number;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  const flat = useMemo(() => flattenFolders(nodes), [nodes]);

  function submit(form: FormData) {
    const folderName = String(form.get("name") ?? "").trim();
    if (!folderName) return;
    form.set("name", folderName);
    toast.promise(createFolder({}, form), {
      loading: "در حال ساخت پوشه…",
      success: () => {
        setName("");
        setParentId("");
        return "پوشه ساخته شد.";
      },
      error: (error) =>
        error instanceof Error ? error.message : "ساخت پوشه انجام نشد.",
    });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>فایلینگ و پوشه‌ها</h1>
          <p>
            فایل‌های ملکی را بر اساس کمپین، منطقه، مالک یا هر فرآیند کاری مرتب
            کنید.
          </p>
        </div>
        <div className="heading-actions">
          <Button asChild variant="outline">
            <Link href="/folders/unfiled">
              <Inbox size={17} />
              بدون پوشه ({fa(unfiledCount)})
            </Link>
          </Button>
        </div>
      </div>

      <section className="folder-workspace">
        <div className="panel folder-create-panel">
          <div className="section-title">
            <FolderPlus size={19} /> ساخت پوشه جدید
          </div>
          <form action={submit} className="folder-create-form">
            <input type="hidden" name="parentId" value={parentId} />
            <label>
              نام پوشه
              <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="مثلاً فایل‌های منطقه یک"
                required
                maxLength={80}
              />
            </label>
            <label className="folder-create-parent">
              والد (اختیاری)
              <select
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                aria-label="پوشه والد"
              >
                <option value="">بدون والد — سطح اصلی</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.depth ? `${"　".repeat(option.depth)}↳ ` : ""}
                    {option.path}
                  </option>
                ))}
              </select>
            </label>
            <label>
              رنگ پوشه
              <input type="color" name="color" defaultValue="#147d70" />
            </label>
            <Button type="submit">ساخت پوشه</Button>
          </form>
        </div>

        <div className="folder-list-header">
          <div>
            <strong>پوشه‌های شما</strong>
            <span>
              {fa(flat.length)} پوشه · {fa(unfiledCount)} فایل بدون پوشه
            </span>
          </div>
          <Link href="/properties">مشاهده همه فایل‌ها</Link>
        </div>

        <div className="panel folder-tree-panel">
          <FolderTree nodes={nodes} options={options} flat={flat} />
        </div>

        {flat.length > 0 && (
          <p className="folder-hint">
            <FolderOpen size={15} />
            برای دیدن فایل‌های هر پوشه روی نام آن کلیک کنید. با دکمه پین
            می‌توانید پوشه‌های پرکاربرد را همیشه در منوی کناری داشته باشید.
          </p>
        )}
      </section>
    </>
  );
}

function flattenFolders(
  nodes: FolderNode[],
): { id: string; parentId: string | null }[] {
  const out: { id: string; parentId: string | null }[] = [];
  const walk = (list: FolderNode[]) => {
    for (const node of list) {
      out.push({ id: node.id, parentId: node.parentId });
      walk(node.nodes);
    }
  };
  walk(nodes);
  return out;
}
