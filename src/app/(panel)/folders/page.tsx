import { requireUser } from "@/lib/auth";
import { countUnfiledProperties, listAllFolders } from "@/repositories/folders";
import { folderOptions, toFolderNodes } from "@/lib/folder-tree";
import { FoldersPage } from "@/components/folders-page";

export const dynamic = "force-dynamic";

export const metadata = { title: "فایلینگ و پوشه‌ها" };

export default async function Page() {
  const user = await requireUser();
  const [all, unfiledCount] = await Promise.all([
    listAllFolders(user),
    countUnfiledProperties(user),
  ]);
  return (
    <FoldersPage
      nodes={toFolderNodes(all)}
      options={folderOptions(all)}
      unfiledCount={unfiledCount}
    />
  );
}
