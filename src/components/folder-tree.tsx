"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Folder } from "lucide-react";
import {
  DeleteFolderDialog,
  EditFolderDialog,
  PinButton,
  SubfolderButton,
} from "./folder-dialogs";
import type { FolderOption } from "./folder-select";
import type { FolderNode } from "@/lib/folder-tree";
import { fa } from "@/lib/utils";

const MAX_FOLDER_DEPTH = 3;

export function FolderTree({
  nodes,
  options,
  flat,
}: {
  nodes: FolderNode[];
  options: FolderOption[];
  flat: { id: string; parentId: string | null }[];
}) {
  if (!nodes.length)
    return (
      <div className="empty-state folder-empty">
        <Folder size={36} />
        <h3>هنوز پوشه‌ای ندارید</h3>
        <p>اولین پوشه را بسازید و فایل‌های دفتر را منظم کنید.</p>
      </div>
    );
  return (
    <ul className="folder-tree">
      {nodes.map((node) => (
        <FolderNodeRow
          key={node.id}
          node={node}
          options={options}
          flat={flat}
        />
      ))}
    </ul>
  );
}

function FolderNodeRow({
  node,
  options,
  flat,
}: {
  node: FolderNode;
  options: FolderOption[];
  flat: { id: string; parentId: string | null }[];
}) {
  const [expanded, setExpanded] = useState(node.depth === 0);
  const hasChildren = node.nodes.length > 0;
  const editable = {
    id: node.id,
    name: node.name,
    properties: node.properties,
    childCount: node.childCount,
    parentId: node.parentId,
  };

  return (
    <li
      className="folder-node"
      style={{ "--folder-color": node.color } as React.CSSProperties}
    >
      <div className="folder-node-row">
        <button
          type="button"
          className="folder-node-toggle"
          aria-expanded={expanded}
          aria-label={expanded ? "بستن زیرپوشه‌ها" : "باز کردن زیرپوشه‌ها"}
          disabled={!hasChildren}
          onClick={() => setExpanded((value) => !value)}
        >
          {hasChildren ? (
            <ChevronDown
              size={16}
              style={{
                transform: expanded ? "none" : "rotate(-90deg)",
                transition: "transform .18s ease",
              }}
            />
          ) : (
            <span className="folder-node-leaf" />
          )}
        </button>

        <Link href={`/folders/${node.id}`} className="folder-node-main">
          <span className="folder-node-icon">
            <Folder size={19} />
          </span>
          <span className="folder-node-text">
            <strong>{node.name}</strong>
            <small>
              {fa(node.properties)} فایل
              {node.childCount ? ` · ${fa(node.childCount)} زیرپوشه` : ""}
              {node.depth ? ` · ${node.path}` : ""}
            </small>
          </span>
        </Link>

        <div className="folder-node-actions">
          {node.depth < MAX_FOLDER_DEPTH && (
            <SubfolderButton parentId={node.id} color={node.color} />
          )}
          <PinButton
            folderId={node.id}
            pinned={node.pinned}
            label={node.pinned ? "برداشتن پین" : "پین کردن در منوی کناری"}
          >
            <PinGlyph pinned={node.pinned} />
          </PinButton>
          <EditFolderDialog node={node} options={options} flat={flat} />
          <DeleteFolderDialog folder={editable} options={options} flat={flat} />
        </div>
      </div>

      {hasChildren && expanded && (
        <ul className="folder-node-children">
          {node.nodes.map((child) => (
            <FolderNodeRow
              key={child.id}
              node={child}
              options={options}
              flat={flat}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function PinGlyph({ pinned }: { pinned: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={pinned ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 17v5" />
      <path d="M9 10.8V4h6v6.8l2 3.2H7Z" />
    </svg>
  );
}
