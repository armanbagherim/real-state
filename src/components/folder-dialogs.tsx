"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createFolder,
  deleteFolder,
  toggleFolderPin,
  updateFolder,
} from "@/actions/folders";
import { Button } from "./ui/button";
import { ActionDialog } from "./action-dialog";
import type { FolderOption } from "./folder-select";
import {
  descendantIds,
  FOLDER_UNFILED,
  type FolderNode,
} from "@/lib/folder-tree";
import { fa } from "@/lib/utils";
import type { FolderActionResult } from "@/actions/folders";

const empty: FolderActionResult = {};

type FlatFolder = { id: string; parentId: string | null };

function PinButton({
  folderId,
  pinned,
  label,
  children,
}: {
  folderId: string;
  pinned: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const [state, action, pending] = useActionState(toggleFolderPin, empty);
  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state.success]);
  return (
    <form action={action}>
      <input type="hidden" name="folderId" value={folderId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={pending}
        className={pinned ? "folder-pin-active" : undefined}
        aria-label={label}
        title={label}
      >
        {children}
      </Button>
    </form>
  );
}

function SubfolderButton({
  parentId,
  color,
  trigger,
}: {
  parentId: string;
  color: string;
  trigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant={trigger ? "outline" : "ghost"}
        size={trigger ? "sm" : "icon"}
        onClick={() => setOpen(true)}
        aria-label="ساخت زیرپوشه"
        title="ساخت زیرپوشه"
      >
        {trigger ? <FolderPlus size={15} /> : <Plus size={16} />}
        {trigger && "زیرپوشه"}
      </Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title="ساخت زیرپوشه"
        action={createFolder}
        initialState={empty}
        hidden={{ parentId, color }}
        submitLabel="ساخت زیرپوشه"
        fields={[
          {
            type: "text",
            name: "name",
            label: "نام زیرپوشه",
            placeholder: "مثلاً واحدهای طبقه اول",
            autoFocus: true,
            maxLength: 80,
          },
        ]}
      />
    </>
  );
}

function EditFolderDialog({
  node,
  options,
  flat,
  trigger = "icon",
}: {
  node: FolderNode;
  options: FolderOption[];
  flat: FlatFolder[];
  trigger?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const blocked = descendantIds(node.id, flat);
  const parentOptions = options.filter((option) => !blocked.has(option.id));

  return (
    <>
      {trigger === "button" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          ویرایش پوشه
        </Button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label={`ویرایش پوشه ${node.name}`}
          title="ویرایش پوشه"
        >
          <Pencil size={16} />
        </Button>
      )}
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={`ویرایش پوشه «${node.name}»`}
        action={updateFolder}
        initialState={empty}
        hidden={{ id: node.id }}
        submitLabel="ذخیره تغییرات"
        fields={[
          {
            type: "text",
            name: "name",
            label: "نام پوشه",
            defaultValue: node.name,
            maxLength: 80,
          },
          {
            type: "color",
            name: "color",
            label: "رنگ پوشه",
            defaultValue: node.color,
          },
          {
            type: "select",
            name: "parentId",
            label: "پوشه والد",
            defaultValue: node.parentId ?? "",
            options: [
              { value: "", label: "بدون والد — سطح اصلی" },
              ...parentOptions.map((option) => ({
                value: option.id,
                label: `${option.depth ? "↳ " : ""}${option.path}`,
              })),
            ],
          },
        ]}
      />
    </>
  );
}

export function DeleteFolderDialog({
  folder,
  options,
  flat,
  redirectTo,
  trigger = "icon",
}: {
  folder: {
    id: string;
    name: string;
    properties: number;
    childCount: number;
    parentId: string | null;
  };
  options: FolderOption[];
  flat: FlatFolder[];
  redirectTo?: string;
  trigger?: "icon" | "button";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const blocked = descendantIds(folder.id, flat);
  const targets = options.filter((option) => !blocked.has(option.id));

  return (
    <>
      <Button
        type="button"
        variant={trigger === "button" ? "destructive" : "ghost"}
        size={trigger === "button" ? "sm" : "icon"}
        onClick={() => setOpen(true)}
        aria-label={`حذف پوشه ${folder.name}`}
        title="حذف پوشه"
      >
        <Trash2 size={16} />
        {trigger === "button" && "حذف"}
      </Button>
      <ActionDialog
        open={open}
        onOpenChange={setOpen}
        title={`حذف پوشه «${folder.name}»`}
        action={deleteFolder}
        initialState={empty}
        hidden={{ id: folder.id }}
        submitLabel="حذف پوشه"
        submitVariant="destructive"
        note={
          <p className="muted-note">
            محتوای این پوشه ({fa(folder.properties)} فایل و{" "}
            {fa(folder.childCount)} زیرپوشه) حذف نمی‌شود؛ به مقصد انتخابی منتقل
            می‌شود.
          </p>
        }
        onSuccess={() => {
          if (redirectTo) router.push(redirectTo);
        }}
        fields={[
          {
            type: "select",
            name: "moveTo",
            label: "انتقال محتوا به",
            defaultValue: FOLDER_UNFILED,
            options: [
              { value: FOLDER_UNFILED, label: "خارج از پوشه‌ها (بدون پوشه)" },
              ...targets.map((option) => ({
                value: option.id,
                label: option.path,
              })),
            ],
          },
        ]}
      />
    </>
  );
}

export { PinButton, SubfolderButton, EditFolderDialog };
