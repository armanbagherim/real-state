"use client";
import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RecordForm, type Field } from "@/components/forms";

export function UserManagementDialog({
  userId,
  name,
  fields,
  values,
}: {
  userId: string;
  name: string;
  fields: Field[];
  values: Record<string, string>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Settings2 size={16} />
          مدیریت
        </Button>
      </DialogTrigger>
      <DialogContent title={`مدیریت ${name}`}>
        <p className="muted">
          وضعیت تأیید و سطح دسترسی این کاربر را تنظیم کنید.
        </p>
        <RecordForm
          kind="user"
          fields={fields}
          hidden={{ userId }}
          values={values}
        />
      </DialogContent>
    </Dialog>
  );
}
