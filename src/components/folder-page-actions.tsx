"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { toggleFolderPin, type FolderActionResult } from "@/actions/folders";
import { Button } from "./ui/button";
import {
  DeleteFolderDialog,
  EditFolderDialog,
  SubfolderButton,
} from "./folder-dialogs";
import type { FolderOption } from "./folder-select";

const empty: FolderActionResult = {};

export function FolderPageActions({
  folder,
  options,
  flat,
}: {
  folder: {
    id: string;
    name: string;
    color: string;
    parentId: string | null;
    properties: number;
    childCount: number;
    pinned: boolean;
  };
  options: FolderOption[];
  flat: { id: string; parentId: string | null }[];
}) {
  const router = useRouter();
  const [pinState, pinAction, pinning] = useActionState(toggleFolderPin, empty);

  useEffect(() => {
    if (!pinState.success) return;
    toast.success(pinState.success);
    router.refresh();
  }, [pinState.success, router]);

  const node = {
    id: folder.id,
    name: folder.name,
    color: folder.color,
    parentId: folder.parentId,
    properties: folder.properties,
    childCount: folder.childCount,
    pinned: folder.pinned,
    depth: 0,
    path: folder.name,
    nodes: [],
  };

  return (
    <div className="folder-page-actions">
      <form action={pinAction}>
        <input type="hidden" name="folderId" value={folder.id} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pinning}
          className={folder.pinned ? "folder-pin-active" : undefined}
        >
          {folder.pinned ? <PinOff size={15} /> : <Pin size={15} />}
          {folder.pinned ? "برداشتن پین" : "پین در منو"}
        </Button>
      </form>
      <EditFolderDialog
        node={node}
        options={options}
        flat={flat}
        trigger="button"
      />
      <SubfolderButton parentId={folder.id} color={folder.color} trigger />
      <DeleteFolderDialog
        folder={folder}
        options={options}
        flat={flat}
        redirectTo="/folders"
        trigger="button"
      />
    </div>
  );
}
