"use client";
import { RecordForm, propertyFields } from "./forms";
export function PropertyForm({
  owners,
  id,
  values,
  rate,
}: {
  owners: { id: string; fullName: string }[];
  id?: string;
  values?: Record<string, string | number | boolean>;
  rate: number;
}) {
  return (
    <RecordForm
      kind="property"
      id={id}
      fields={propertyFields(owners)}
      values={
        values ?? {
          city: "تهران",
          status: "ACTIVE",
          totalFloors: 1,
          unitsPerFloor: 1,
        }
      }
      rate={rate}
    />
  );
}
