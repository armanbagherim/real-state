"use client";
import { PropertyForm } from "@/components/property-form";
import { FormDialog } from "@/components/form-dialog";

export function NewPropertyDialog({
  owners,
  rate,
}: {
  owners: { id: string; fullName: string }[];
  rate: number;
}) {
  return (
    <FormDialog title="ثبت فایل جدید" triggerLabel="ثبت فایل جدید" size="wide">
      <PropertyForm owners={owners} rate={rate} />
    </FormDialog>
  );
}
