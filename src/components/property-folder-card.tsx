"use client";

import Link from "next/link";
import { Folder, FolderX } from "lucide-react";
import { MovePropertyButton } from "./move-property-button";
import type { FolderOption } from "./folder-select";

/** Shows where the file is filed and opens the folder picker. */
export function PropertyFolderCard({
  folder,
  propertyId,
  folders,
}: {
  folder: { id: string; name: string; color: string } | null;
  propertyId: string;
  folders: FolderOption[];
}) {
  return (
    <div className="property-folder-card">
      <div className="property-folder-info">
        <span className="property-folder-label">
          <Folder size={15} /> بایگانی در پوشه
        </span>
        {folder ? (
          <Link
            href={`/folders/${folder.id}`}
            className="folder-cell folder-cell-lg"
            style={{ "--folder-color": folder.color } as React.CSSProperties}
          >
            <Folder size={15} />
            <span>{folder.name}</span>
          </Link>
        ) : (
          <span className="folder-cell folder-cell-lg folder-cell-empty">
            <FolderX size={15} />
            <span>این فایل در هیچ پوشه‌ای نیست</span>
          </span>
        )}
      </div>
      <MovePropertyButton
        propertyId={propertyId}
        currentFolderId={folder?.id ?? null}
        folders={folders}
        size="sm"
        label={folder ? "تغییر پوشه" : "انتخاب پوشه"}
      />
    </div>
  );
}
