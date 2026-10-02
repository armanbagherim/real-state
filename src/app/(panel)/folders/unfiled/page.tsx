import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { countUnfiledProperties, listAllFolders } from "@/repositories/folders";
import { folderOptions } from "@/lib/folder-tree";
import { PropertiesPage } from "@/components/properties-page";
import { fa } from "@/lib/utils";
import type { SearchParams } from "@/repositories/properties";

export const dynamic = "force-dynamic";

export const metadata = { title: "فایل‌های بدون پوشه" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const [all, unfiledCount] = await Promise.all([
    listAllFolders(user),
    countUnfiledProperties(user),
  ]);
  return (
    <PropertiesPage
      searchParams={searchParams}
      title="فایل‌های بدون پوشه"
      description="فایل‌هایی که هنوز در هیچ پوشه‌ای بایگانی نشده‌اند."
      preset={{ folderId: "__unfiled__" }}
      lockedFolderId="__unfiled__"
      above={
        <div className="folder-breadcrumbs">
          <Link href="/folders">پوشه‌ها</Link>
          <span>
            <Inbox size={14} />
            <strong>بدون پوشه ({fa(unfiledCount)})</strong>
          </span>
        </div>
      }
      folderOptions={folderOptions(all)}
    />
  );
}
