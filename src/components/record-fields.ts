import type { Field } from "@/components/forms";

type PropertyOption = { id: string; fileCode: string; title: string };
type OwnerOption = { id: string; fullName: string };

const propertyOptions = (properties: PropertyOption[]) => [
  { value: "", label: "بدون ملک" },
  ...properties.map((p) => ({
    value: p.id,
    label: `${p.fileCode} · ${p.title}`,
  })),
];

const ownerOptions = (owners: OwnerOption[]) => [
  { value: "", label: "بدون مالک" },
  ...owners.map((o) => ({ value: o.id, label: o.fullName })),
];

export function contractFields(properties: PropertyOption[]): Field[] {
  return [
    {
      name: "propertyId",
      label: "ملک",
      type: "select",
      options: [
        { value: "", label: "انتخاب ملک" },
        ...properties.map((p) => ({
          value: p.id,
          label: `${p.fileCode} · ${p.title}`,
        })),
      ],
      required: true,
      wide: true,
    },
    { name: "tenantName", label: "نام مستأجر", required: true },
    {
      name: "tenantMobile",
      label: "شماره همراه مستأجر",
      type: "tel",
      required: true,
    },
    { name: "startDate", label: "تاریخ شروع", type: "date", required: true },
    { name: "endDate", label: "تاریخ پایان", type: "date", required: true },
    {
      name: "mortgageAmount",
      label: "رهن (تومان)",
      type: "number",
      required: true,
    },
    {
      name: "rentAmount",
      label: "اجاره ماهانه (تومان)",
      type: "number",
      required: true,
    },
    {
      name: "description",
      label: "توضیحات قرارداد",
      type: "textarea",
      wide: true,
    },
  ];
}

export function followUpFields(
  properties: PropertyOption[],
  owners: OwnerOption[],
): Field[] {
  return [
    {
      name: "propertyId",
      label: "ملک مرتبط (اختیاری)",
      type: "select",
      options: propertyOptions(properties),
    },
    {
      name: "ownerId",
      label: "مالک (در صورت انتخاب ملک، خودکار تعیین می‌شود)",
      type: "select",
      options: ownerOptions(owners),
    },
    {
      name: "type",
      label: "نوع پیگیری",
      type: "select",
      options: [
        ["CALL", "تماس"],
        ["FOLLOW_UP", "پیگیری فایل"],
        ["CONTRACT", "قرارداد"],
        ["OWNER", "مالک"],
        ["OTHER", "سایر"],
      ].map(([value, label]) => ({ value, label })),
    },
    {
      name: "followUpDate",
      label: "تاریخ پیگیری",
      type: "date",
      required: true,
    },
    {
      name: "note",
      label: "شرح پیگیری",
      type: "textarea",
      required: true,
      wide: true,
    },
  ];
}

export function reminderFields(
  properties: PropertyOption[],
  owners: OwnerOption[],
): Field[] {
  return [
    { name: "title", label: "عنوان یادآوری", required: true, wide: true },
    {
      name: "propertyId",
      label: "ملک مرتبط",
      type: "select",
      options: propertyOptions(properties),
    },
    {
      name: "ownerId",
      label: "مالک مرتبط",
      type: "select",
      options: ownerOptions(owners),
    },
    {
      name: "type",
      label: "نوع یادآوری",
      type: "select",
      options: [
        { value: "CUSTOM", label: "شخصی" },
        { value: "CALL", label: "تماس" },
        { value: "FOLLOW_UP", label: "پیگیری" },
      ],
    },
    { name: "remindAt", label: "تاریخ یادآوری", type: "date", required: true },
    { name: "description", label: "توضیحات", type: "textarea", wide: true },
  ];
}
