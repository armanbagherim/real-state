"use client";

import { Folder } from "lucide-react";
import Link from "next/link";
import { fa } from "@/lib/utils";

type Subfolder = {
  id: string;
  name: string;
  color: string;
  _count: { properties: number; children: number };
};

export function FolderSubfolderGrid({ folders }: { folders: Subfolder[] }) {
  return (
    <div className="folder-grid">
      {folders.map((folder) => (
        <Link
          key={folder.id}
          href={`/folders/${folder.id}`}
          className="folder-card"
          style={{ "--folder-color": folder.color } as React.CSSProperties}
        >
          <span className="folder-card-main">
            <span className="folder-card-icon">
              <Folder size={23} />
            </span>
            <span>
              <strong>{folder.name}</strong>
              <small>
                {fa(folder._count.properties)} فایل
                {folder._count.children
                  ? ` · ${fa(folder._count.children)} زیرپوشه`
                  : ""}
              </small>
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
