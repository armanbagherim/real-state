import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  filingFolderAccessWhere,
  propertyAccessWhere,
  type CurrentUser,
} from "@/lib/access";
import { ancestorsOf } from "@/lib/folder-tree";

const folderInclude = {
  _count: {
    select: {
      properties: { where: { deletedAt: null } },
      children: true,
    },
  },
  pins: { select: { id: true } },
} satisfies Prisma.FilingFolderInclude;

export type FolderWithMeta = Prisma.FilingFolderGetPayload<{
  include: typeof folderInclude;
}>;

const folderWhere = (user: CurrentUser): Prisma.FilingFolderWhereInput =>
  filingFolderAccessWhere(user);

export async function listAllFolders(user: CurrentUser) {
  return db.filingFolder.findMany({
    where: folderWhere(user),
    include: {
      ...folderInclude,
      parent: { select: { id: true, name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listChildFolders(user: CurrentUser, parentId: string) {
  return db.filingFolder.findMany({
    where: { ...folderWhere(user), parentId },
    include: folderInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export const PINNED_FOLDER_LIMIT = 8;

export async function listPinnedFolders(user: CurrentUser) {
  const rows = await db.filingFolderPin.findMany({
    where: { userId: user.id, folder: folderWhere(user) },
    select: {
      folder: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return {
    folders: rows.slice(0, PINNED_FOLDER_LIMIT).map(({ folder }) => folder),
    total: rows.length,
  };
}

export async function getFolder(id: string, user: CurrentUser) {
  const folder = await db.filingFolder.findFirst({
    where: { id, ...folderWhere(user) },
    include: folderInclude,
  });
  if (!folder) return null;
  const scope = await db.filingFolder.findMany({
    where: folderWhere(user),
    select: { id: true, parentId: true, name: true },
  });
  const trail = ancestorsOf(id, scope);
  const names = new Map(scope.map((f) => [f.id, f.name]));
  const breadcrumbs = trail.map((ancestor) => ({
    id: ancestor.id,
    name: names.get(ancestor.id) ?? "",
  }));
  const current = {
    id: folder.id,
    name: folder.name,
    properties: folder._count.properties,
    children: folder._count.children,
  };
  return {
    folder,
    breadcrumbs: [...breadcrumbs, current],
    path: [...breadcrumbs, current].map((b) => b.name).join(" › "),
  };
}

/** Flat id/parent map used for cycle + access validation in server actions. */
export async function folderScope(user: CurrentUser) {
  return db.filingFolder.findMany({
    where: folderWhere(user),
    select: { id: true, parentId: true, name: true, color: true },
  });
}

export async function countUnfiledProperties(user: CurrentUser) {
  return db.property.count({
    where: {
      deletedAt: null,
      folderId: null,
      AND: [propertyAccessWhere(user)],
    },
  });
}
