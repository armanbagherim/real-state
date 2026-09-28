"use client";
import { RecordForm, ownerFields } from "./forms";
export function OwnerForm({
  id,
  values,
}: {
  id?: string;
  values?: Record<string, string>;
}) {
  return (
    <RecordForm kind="owner" fields={ownerFields} id={id} values={values} />
  );
}
