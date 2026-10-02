"use client";

import { FOLDER_UNFILED } from "@/lib/folder-tree";

export type FolderOption = {
  id: string;
  name: string;
  path: string;
  depth: number;
  color: string;
};

export function FolderSelect({
  name,
  value,
  options,
  excludeId,
  allowNone = true,
  noneLabel = "بدون پوشه",
}: {
  name: string;
  value?: string | null;
  options: FolderOption[];
  excludeId?: string;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  return (
    <select name={name} defaultValue={value ?? ""}>
      {allowNone && <option value="">{noneLabel}</option>}
      {options
        .filter((option) => option.id !== excludeId)
        .map((option) => (
          <option key={option.id} value={option.id}>
            {option.depth ? `${"　".repeat(option.depth)}↳ ` : ""}
            {option.path}
          </option>
        ))}
    </select>
  );
}

/** Indented `<option>` list shared by the create-form and action dialogs. */
export function FolderOptionList({
  options,
  includeUnfiled,
}: {
  options: FolderOption[];
  includeUnfiled?: boolean;
}) {
  return (
    <>
      {includeUnfiled && (
        <option value={FOLDER_UNFILED}>— خارج از تمام پوشه‌ها —</option>
      )}
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.depth ? `${"　".repeat(option.depth)}↳ ` : ""}
          {option.path}
        </option>
      ))}
    </>
  );
}
