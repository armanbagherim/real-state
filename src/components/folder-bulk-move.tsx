"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FolderInput, X } from "lucide-react";
import { movePropertiesToFolder } from "@/actions/folders";
import { Button } from "./ui/button";
import { ActionDialog } from "./action-dialog";
import type { FolderOption } from "./folder-select";
import { fa } from "@/lib/utils";

const empty = {};

type Selection = {
  selected: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clear: () => void;
};

const SelectionContext = createContext<Selection | null>(null);

/**
 * Wraps the (server-rendered) property table so its client checkboxes can drive
 * the bulk-move bar, without turning the table itself into a client component.
 */
export function FolderBulkProvider({
  folders,
  excludeFolderId,
  children,
}: {
  folders: FolderOption[];
  excludeFolderId?: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const value = useMemo<Selection>(
    () => ({
      selected,
      has: (id) => selected.includes(id),
      toggle: (id) =>
        setSelected((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        ),
      toggleAll: (ids) =>
        setSelected((prev) =>
          ids.length > 0 && ids.every((id) => prev.includes(id)) ? [] : ids,
        ),
      clear: () => setSelected([]),
    }),
    [selected],
  );

  return (
    <SelectionContext.Provider value={value}>
      {selected.length > 0 && (
        <div className="folder-bulk-bar">
          <span>
            <strong>{fa(selected.length)}</strong> فایل انتخاب شده
          </span>
          <div className="folder-bulk-actions">
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
              <FolderInput size={15} /> انتقال به پوشه
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={value.clear}
            >
              <X size={15} /> لغو انتخاب
            </Button>
          </div>
          <ActionDialog
            open={open}
            onOpenChange={setOpen}
            title="انتقال گروهی فایل‌ها"
            action={movePropertiesToFolder}
            initialState={empty}
            hidden={{ propertyIds: selected }}
            submitLabel="انتقال گروهی"
            note={
              <p className="muted-note">
                {fa(selected.length)} فایل به پوشه انتخابی منتقل می‌شود.
              </p>
            }
            onSuccess={value.clear}
            fields={[
              {
                type: "folders",
                name: "folderId",
                label: "پوشه مقصد",
                options: folders,
                excludeId: excludeFolderId,
              },
            ]}
          />
        </div>
      )}
      {children}
    </SelectionContext.Provider>
  );
}

function useSelection() {
  return useContext(SelectionContext);
}

export function FolderSelectAll({ ids }: { ids: string[] }) {
  const selection = useSelection();
  if (!selection) return null;
  const all = ids.length > 0 && ids.every((id) => selection.has(id));
  return (
    <input
      type="checkbox"
      className="folder-check"
      checked={all}
      onChange={() => selection.toggleAll(ids)}
      aria-label={all ? "برداشتن انتخاب همه" : "انتخاب همه فایل‌های این صفحه"}
    />
  );
}

export function FolderSelectOne({ id }: { id: string }) {
  const selection = useSelection();
  if (!selection) return null;
  return (
    <input
      type="checkbox"
      className="folder-check"
      checked={selection.has(id)}
      onChange={() => selection.toggle(id)}
      aria-label="انتخاب فایل برای انتقال گروهی"
    />
  );
}
