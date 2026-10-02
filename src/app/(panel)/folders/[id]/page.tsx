import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Folder, Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  countUnfiledProperties,
  getFolder,
  listAllFolders,
  listChildFolders,
} from "@/repositories/folders";
import { folderOptions } from "@/lib/folder-tree";
import { PropertiesPage } from "@/components/properties-page";
import { FolderSubfolderGrid } from "@/components/folder-subfolder-grid";
import { FolderPageActions } from "@/components/folder-page-actions";
import { fa } from "@/lib/utils";
import type { SearchParams } from "@/repositories/properties";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const [detail, all] = await Promise.all([
    getFolder(id, user),
    listAllFolders(user),
  ]);
  if (!detail) notFound();

  const [children, unfiledCount] = await Promise.all([
    listChildFolders(user, id),
    countUnfiledProperties(user),
  ]);
  const options = folderOptions(all);
  const { folder, breadcrumbs } = detail;

  return (
    <PropertiesPage
      searchParams={searchParams}
      title={folder.name}
      description={detail.path}
      preset={{ folderId: folder.id }}
      lockedFolderId={folder.id}
      above={
        <div className="folder-breadcrumbs">
          <Link href="/folders">
            <Folder size={15} /> پوشه‌ها
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.id}>
              <ChevronLeft size={14} />
              {index === breadcrumbs.length - 1 ? (
                <strong>{crumb.name}</strong>
              ) : (
                <Link href={`/folders/${crumb.id}`}>{crumb.name}</Link>
              )}
            </span>
          ))}
          <Link href="/folders/unfiled" className="folder-unfiled-link">
            <ChevronLeft size={14} />
            <Inbox size={14} />
            بدون پوشه ({fa(unfiledCount)})
          </Link>
        </div>
      }
      headingExtra={
        <FolderPageActions
          flat={all.map((f) => ({ id: f.id, parentId: f.parentId }))}
          folder={{
            id: folder.id,
            name: folder.name,
            color: folder.color,
            parentId: folder.parentId,
            properties: folder._count.properties,
            childCount: folder._count.children,
            pinned: Boolean(folder.pins.length),
          }}
          options={options}
        />
      }
      afterHeading={
        children.length ? (
          <div className="folder-subfolders">
            <div className="folder-list-header">
              <div>
                <strong>زیرپوشه‌ها</strong>
                <span>{fa(children.length)} زیرپوشه</span>
              </div>
            </div>
            <FolderSubfolderGrid folders={children} />
          </div>
        ) : null
      }
      folderOptions={options}
    />
  );
}
