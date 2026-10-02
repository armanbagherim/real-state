export type FolderTreeInput = {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  pins?: { id: string }[];
  _count?: { properties?: number; children?: number };
};

export type FolderNode = {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  properties: number;
  childCount: number;
  pinned: boolean;
  depth: number;
  path: string;
  nodes: FolderNode[];
};

export const FOLDER_UNFILED = "none";

export function toFolderNodes(folders: FolderTreeInput[]): FolderNode[] {
  const nodes = new Map<string, FolderNode>();
  for (const folder of folders) {
    nodes.set(folder.id, {
      id: folder.id,
      name: folder.name,
      color: folder.color,
      parentId: folder.parentId,
      properties: folder._count?.properties ?? 0,
      childCount: folder._count?.children ?? 0,
      pinned: Boolean(folder.pins?.length),
      depth: 0,
      path: folder.name,
      nodes: [],
    });
  }

  const placed = new Set<string>();

  /** Claims every unplaced node whose `parentId` matches, depth-first. */
  const attach = (
    parentId: string | null,
    depth: number,
    trail: string[],
    guard: Set<string>,
  ): FolderNode[] => {
    const out: FolderNode[] = [];
    for (const node of nodes.values()) {
      if (guard.has(node.id) || placed.has(node.id)) continue;
      if (node.parentId !== parentId) continue;
      guard.add(node.id);
      placed.add(node.id);
      node.depth = depth;
      node.path = [...trail, node.name].join(" \u203a ");
      node.nodes = attach(node.id, depth + 1, [...trail, node.name], guard);
      guard.delete(node.id);
      out.push(node);
    }
    out.sort(compareNodes);
    return out;
  };

  const roots = attach(null, 0, [], new Set());

  // Folders whose parent is outside the accessible scope (or sits in a parent
  // cycle) must still be reachable, so surface them as extra roots.
  for (const node of nodes.values()) {
    if (placed.has(node.id)) continue;
    node.depth = 0;
    node.path = node.name;
    node.nodes = attach(node.id, 1, [node.name], new Set([node.id]));
    roots.push(node);
  }
  roots.sort(compareNodes);
  return roots;
}

function compareNodes(a: FolderNode, b: FolderNode) {
  return a.name.localeCompare(b.name, "fa") || a.id.localeCompare(b.id);
}

/** Depth-first flatten, ideal for `<select>` options and breadcrumbs. */
export function flattenFolderTree(nodes: FolderNode[]): FolderNode[] {
  const out: FolderNode[] = [];
  const walk = (list: FolderNode[]) => {
    for (const node of list) {
      out.push(node);
      walk(node.nodes);
    }
  };
  walk(nodes);
  return out;
}

export type FlatOption = { id: string; depth: number };

export type OptionNode<T extends FlatOption> = T & {
  children: OptionNode<T>[];
};

/**
 * Rebuilds nesting from a depth-first, `depth`-annotated list. Used by client
 * pickers that get only the flat option list from the server.
 */
export function groupByDepth<T extends FlatOption>(list: T[]): OptionNode<T>[] {
  const roots: OptionNode<T>[] = [];
  const stack: OptionNode<T>[] = [];
  for (const item of list) {
    while (stack.length && stack[stack.length - 1].depth >= item.depth) {
      stack.pop();
    }
    const node: OptionNode<T> = { ...item, children: [] };
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

export function folderOptions(folders: FolderTreeInput[]) {
  return flattenFolderTree(toFolderNodes(folders)).map((node) => ({
    id: node.id,
    name: node.name,
    path: node.path,
    depth: node.depth,
    color: node.color,
  }));
}

/** Walks `parentId` up from `id`; returns ancestors ordered root-first. */
export function ancestorsOf(
  id: string,
  folders: { id: string; parentId: string | null }[],
): { id: string }[] {
  const parentOf = new Map(folders.map((f) => [f.id, f.parentId]));
  const trail: { id: string }[] = [];
  const guard = new Set<string>([id]);
  let current = parentOf.get(id) ?? null;
  while (current) {
    if (guard.has(current)) break;
    guard.add(current);
    trail.push({ id: current });
    current = parentOf.get(current) ?? null;
  }
  return trail.reverse();
}

/** Ids of every folder underneath `id` (excludes `id` itself). */
export function descendantIds(
  id: string,
  folders: { id: string; parentId: string | null }[],
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const folder of folders) {
    if (!folder.parentId) continue;
    const bucket = childrenOf.get(folder.parentId);
    if (bucket) bucket.push(folder.id);
    else childrenOf.set(folder.parentId, [folder.id]);
  }
  const out = new Set<string>();
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length) {
    const next = stack.pop()!;
    if (out.has(next)) continue;
    out.add(next);
    stack.push(...(childrenOf.get(next) ?? []));
  }
  return out;
}
