"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  filingFolderAccessWhere,
  propertyCanEditWhere,
  type CurrentUser,
} from "@/lib/access";
import { FOLDER_UNFILED, descendantIds } from "@/lib/folder-tree";

export type FolderActionResult = { error?: string; success?: string };

const nameSchema = z
  .string()
  .trim()
  .min(2, "نام پوشه حداقل ۲ حرف باشد.")
  .max(80, "نام پوشه حداکثر ۸۰ حرف باشد.");
const colorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "رنگ پوشه معتبر نیست.");
const idSchema = z.string().trim().min(1);

const MAX_DEPTH = 3;

function refresh() {
  revalidatePath("/folders");
  revalidatePath("/properties");
  revalidatePath("/", "layout");
}

function fail(error: unknown, fallback: string): FolderActionResult {
  if (error instanceof z.ZodError) {
    return { error: error.issues[0]?.message ?? fallback };
  }
  if (error instanceof Error) return { error: error.message };
  return { error: fallback };
}

type Scope = {
  id: string;
  parentId: string | null;
  name: string;
  color: string;
};

async function scope(user: CurrentUser): Promise<Scope[]> {
  return db.filingFolder.findMany({
    where: filingFolderAccessWhere(user),
    select: { id: true, parentId: true, name: true, color: true },
  });
}

function assertParent(
  folders: Scope[],
  parentId: string | null,
  selfId?: string,
): void {
  if (!parentId) return;
  if (parentId === selfId) throw new Error("یک پوشه نمی‌تواند والد خودش باشد.");
  if (!folders.some((f) => f.id === parentId))
    throw new Error("پوشه مادر پیدا نشد.");
  if (selfId && descendantIds(selfId, folders).has(parentId))
    throw new Error("نمی‌توانید پوشه را داخل یکی از زیرپوشه‌های خودش ببرید.");
  let depth = 0;
  let cursor: string | null = parentId;
  while (cursor && depth < MAX_DEPTH + 2) {
    depth += 1;
    cursor = folders.find((f) => f.id === cursor)?.parentId ?? null;
  }
  if (depth > MAX_DEPTH + 1)
    throw new Error(`عمق پوشه‌ها حداکثر ${MAX_DEPTH + 1} سطح باشد.`);
}

function assertUniqueName(
  folders: Scope[],
  name: string,
  parentId: string | null,
  selfId?: string,
): void {
  const clash = folders.some(
    (f) =>
      f.id !== selfId &&
      f.parentId === parentId &&
      f.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (clash)
    throw new Error(
      parentId
        ? "در همین پوشه، پوشه‌ای با این نام وجود دارد."
        : "پوشه‌ای با این نام در سطح اصلی وجود دارد.",
    );
}

export async function createFolder(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const name = nameSchema.parse(form.get("name"));
    const color = colorSchema.parse(form.get("color") || "#147d70");
    const parentId = idSchema
      .optional()
      .parse(form.get("parentId") || undefined);
    const folders = await scope(user);
    const resolvedParent = parentId || null;
    assertParent(folders, resolvedParent);
    assertUniqueName(folders, name, resolvedParent);
    await db.filingFolder.create({
      data: {
        name,
        color,
        parentId: resolvedParent,
        officeId: user.officeId,
        createdByUserId: user.id,
        sortOrder: folders.filter((f) => f.parentId === resolvedParent).length,
      },
    });
    refresh();
    return { success: "پوشه ساخته شد." };
  } catch (error) {
    return fail(error, "ساخت پوشه انجام نشد.");
  }
}

export async function updateFolder(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const id = idSchema.parse(form.get("id"));
    const name = nameSchema.parse(form.get("name"));
    const color = colorSchema.parse(form.get("color") || "#147d70");
    const parentRaw = form.get("parentId");
    const folders = await scope(user);
    if (!folders.some((f) => f.id === id)) throw new Error("پوشه پیدا نشد.");
    const parentId =
      parentRaw === null || parentRaw === "" || parentRaw === id
        ? folders.find((f) => f.id === id)?.parentId ?? null
        : idSchema.parse(parentRaw);
    assertParent(folders, parentId, id);
    assertUniqueName(folders, name, parentId, id);
    await db.filingFolder.update({
      where: { id },
      data: { name, color, parentId },
    });
    refresh();
    return { success: "پوشه به‌روزرسانی شد." };
  } catch (error) {
    return fail(error, "ویرایش پوشه انجام نشد.");
  }
}

export async function renameFolder(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const id = idSchema.parse(form.get("id"));
    const name = nameSchema.parse(form.get("name"));
    const folders = await scope(user);
    const current = folders.find((f) => f.id === id);
    if (!current) throw new Error("پوشه پیدا نشد.");
    assertUniqueName(folders, name, current.parentId, id);
    await db.filingFolder.update({ where: { id }, data: { name } });
    refresh();
    return { success: "نام پوشه تغییر کرد." };
  } catch (error) {
    return fail(error, "تغییر نام پوشه انجام نشد.");
  }
}

/**
 * `moveTo` may be a folder id, `none` (detach), or empty (block when non-empty).
 * Children folders follow their parent up one level instead of being orphaned.
 */
export async function deleteFolder(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const id = idSchema.parse(form.get("id"));
    const moveTo = String(form.get("moveTo") ?? "").trim();
    const folders = await scope(user);
    if (!folders.some((f) => f.id === id)) throw new Error("پوشه پیدا نشد.");

    const children = folders.filter((f) => f.parentId === id);
    const propertyCount = await db.property.count({
      where: { folderId: id, deletedAt: null },
    });

    if (moveTo === "") {
      if (propertyCount || children.length)
        return {
          error:
            "برای حذف، ابتدا فایل‌ها و زیرپوشه‌ها را به مقصد دیگری منتقل کنید یا گزینه «خارج کردن محتوا» را انتخاب کنید.",
        };
    } else {
      const target = moveTo === FOLDER_UNFILED ? null : idSchema.parse(moveTo);
      if (target === id) throw new Error("مقصد نمی‌تواند خود پوشه باشد.");
      assertParent(folders, target, id);
      if (target && descendantIds(id, folders).has(target))
        throw new Error("مقصد نمی‌تواند زیرپوشه این پوشه باشد.");
      await db.$transaction([
        db.property.updateMany({
          where: { folderId: id },
          data: { folderId: target },
        }),
        db.filingFolder.updateMany({
          where: { parentId: id },
          data: { parentId: target },
        }),
        db.filingFolder.delete({ where: { id } }),
      ]);
      refresh();
      const moved = propertyCount + children.length;
      return {
        success: moved
          ? `پوشه حذف شد و ${moved} مورد به مقصد جدید منتقل شد.`
          : "پوشه حذف شد.",
      };
    }

    await db.filingFolder.delete({ where: { id } });
    refresh();
    return { success: "پوشه حذف شد." };
  } catch (error) {
    return fail(error, "حذف پوشه انجام نشد.");
  }
}

export async function toggleFolderPin(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const folderId = idSchema.parse(form.get("folderId"));
    const exists = await db.filingFolder.findFirst({
      where: { id: folderId, ...filingFolderAccessWhere(user) },
      select: { id: true },
    });
    if (!exists) throw new Error("پوشه پیدا نشد.");
    const key = { folderId_userId: { folderId, userId: user.id } };
    const pin = await db.filingFolderPin.findUnique({ where: key });
    if (pin) await db.filingFolderPin.delete({ where: { id: pin.id } });
    else
      await db.filingFolderPin.create({ data: { folderId, userId: user.id } });
    refresh();
    return {
      success: pin
        ? "پوشه از منوی کناری برداشته شد."
        : "پوشه به منوی کناری پین شد.",
    };
  } catch (error) {
    return fail(error, "تغییر وضعیت پین انجام نشد.");
  }
}

function resolveTarget(
  raw: string | null,
  folders: Scope[],
  selfFolderId?: string,
): string | null {
  if (raw === null || raw === "" || raw === FOLDER_UNFILED) return null;
  const target = idSchema.parse(raw);
  if (selfFolderId && target === selfFolderId)
    throw new Error("ملک از قبل داخل همین پوشه است.");
  if (!folders.some((f) => f.id === target))
    throw new Error("پوشه انتخاب‌شده پیدا نشد.");
  return target;
}

export async function movePropertyToFolder(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const propertyId = idSchema.parse(form.get("propertyId"));
    const folders = await scope(user);
    const target = resolveTarget(
      form.get("folderId") as string | null,
      folders,
    );
    const property = await db.property.findFirst({
      where: {
        id: propertyId,
        deletedAt: null,
        AND: [propertyCanEditWhere(user)],
      },
      select: { id: true },
    });
    if (!property) throw new Error("انتقال این فایل برای شما مجاز نیست.");
    await db.property.update({
      where: { id: propertyId },
      data: { folderId: target },
    });
    refresh();
    return {
      success: target ? "فایل به پوشه منتقل شد." : "فایل از پوشه خارج شد.",
    };
  } catch (error) {
    return fail(error, "انتقال فایل انجام نشد.");
  }
}

export async function movePropertiesToFolder(
  _prev: FolderActionResult,
  form: FormData,
): Promise<FolderActionResult> {
  const user = await requireUser();
  try {
    const ids = form
      .getAll("propertyIds")
      .map((value) => String(value))
      .filter(Boolean);
    if (!ids.length) throw new Error("هیچ فایلی انتخاب نشده است.");
    if (ids.length > 200) throw new Error("حداکثر ۲۰۰ فایل در هر بار.");
    const folders = await scope(user);
    const target = resolveTarget(
      form.get("folderId") as string | null,
      folders,
    );
    const editable = await db.property.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        AND: [propertyCanEditWhere(user)],
      },
      select: { id: true },
    });
    if (!editable.length) throw new Error("فایل قابل انتقالی یافت نشد.");
    const { count } = await db.property.updateMany({
      where: { id: { in: editable.map((p) => p.id) } },
      data: { folderId: target },
    });
    refresh();
    const skipped = ids.length - count;
    return {
      success: skipped
        ? `${count} فایل منتقل شد؛ ${skipped} فایل به دلیل سطح دسترسی منتقل نشد.`
        : target
        ? `${count} فایل به پوشه منتقل شد.`
        : `${count} فایل از پوشه خارج شد.`,
    };
  } catch (error) {
    return fail(error, "انتقال گروهی فایل‌ها انجام نشد.");
  }
}
