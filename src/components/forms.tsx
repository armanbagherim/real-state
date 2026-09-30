"use client";
import { useActionState, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { JalaliInput } from "./jalali-input";
import { EntityPicker } from "./entity-picker";
import { saveRecord, type ActionResult } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { propertyTypes, statuses, fa } from "@/lib/utils";
const moneyFields = new Set([
  "salePrice",
  "mortgagePrice",
  "rentPrice",
  "mortgageAmount",
  "rentAmount",
]);
const formatMoneyInput = (value: string) => {
  const digits = value.replace(/[^\d۰-۹٠-٩]/g, "");
  const normalized = digits
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
export type Field = {
  name: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  wide?: boolean;
  hint?: string;
};
function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? <Loader2 size={17} className="spin" /> : <Save size={17} />}{" "}
      {pending ? "در حال ذخیره…" : "ذخیره اطلاعات"}
    </Button>
  );
}
export function RecordForm({
  kind,
  id,
  fields,
  values = {},
  hidden = {},
  rate,
}: {
  kind: string;
  id?: string;
  fields: Field[];
  values?: Record<string, string | number | boolean>;
  hidden?: Record<string, string>;
  rate?: number;
}) {
  const [state, action] = useActionState(
    saveRecord.bind(null, kind, id),
    {} as ActionResult,
  );
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const [mortgage, setMortgage] = useState(Number(values.mortgagePrice ?? 0));
  const [convertible, setConvertible] = useState(Boolean(values.isConvertible));
  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (state.redirect) router.push(state.redirect);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
      errorSummary.current?.focus();
    }
  }, [state, router]);
  useEffect(() => {
    if (!state.values || !formRef.current) return;
    for (const field of fields) {
      const element = formRef.current.elements.namedItem(field.name);
      const value = state.values[field.name];
      if (!element) continue;
      if (element instanceof HTMLInputElement) {
        if (element.type === "checkbox") {
          element.checked = value === "on" || value === "true";
          if (field.name === "isConvertible") setConvertible(element.checked);
        } else {
          element.value = moneyFields.has(field.name)
            ? formatMoneyInput(value ?? "")
            : value ?? "";
          if (field.name === "mortgagePrice")
            setMortgage(Number(element.value.replaceAll(",", "")));
        }
      } else if (
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.value = value ?? "";
      }
    }
  }, [state.values, fields]);
  const formValue = (name: string) =>
    state.values?.[name] ?? values[name] ?? "";
  const checkboxValue = (name: string) => {
    const value = formValue(name);
    return value === true || value === "on" || value === "true";
  };
  return (
    <form action={action} className="record-form" ref={formRef}>
      <div className="form-grid">
        {Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {fields.map((field) => (
          <div
            key={field.name}
            className={`field ${field.wide ? "field-wide" : ""} ${
              field.type === "checkbox" ? "check-field" : ""
            }`}
          >
            <label htmlFor={field.name}>
              {field.label}
              {field.required && (
                <span className="required" aria-hidden="true">
                  {" "}
                  *
                </span>
              )}
            </label>
            {["ownerId", "propertyId"].includes(field.name) ? (
              <EntityPicker
                key={`${field.name}-${String(formValue(field.name))}`}
                name={field.name}
                value={String(formValue(field.name))}
                initialOptions={field.options}
                required={field.required}
                kind={
                  field.name === "ownerId"
                    ? "owners"
                    : kind === "contract"
                    ? "rent-properties"
                    : "properties"
                }
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                defaultValue={String(
                  formValue(field.name) || (field.options?.[0]?.value ?? ""),
                )}
                required={field.required}
              >
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                defaultValue={String(formValue(field.name))}
                required={field.required}
                rows={4}
              />
            ) : field.type === "date" ? (
              <JalaliInput
                name={field.name}
                value={String(formValue(field.name))}
              />
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                defaultChecked={checkboxValue(field.name)}
                onChange={(e) => {
                  if (field.name === "isConvertible")
                    setConvertible(e.target.checked);
                }}
              />
            ) : moneyFields.has(field.name) ? (
              <input
                id={field.name}
                name={field.name}
                type="text"
                inputMode="numeric"
                dir="ltr"
                defaultValue={formatMoneyInput(String(formValue(field.name)))}
                required={field.required}
                onChange={(e) => {
                  e.currentTarget.value = formatMoneyInput(
                    e.currentTarget.value,
                  );
                  if (field.name === "mortgagePrice")
                    setMortgage(
                      Number(e.currentTarget.value.replaceAll(",", "")),
                    );
                }}
                aria-invalid={!!state.fields?.[field.name]}
                aria-describedby={
                  state.fields?.[field.name] ? `${field.name}-error` : undefined
                }
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type ?? "text"}
                defaultValue={String(
                  formValue(field.name) || (field.type === "number" ? 0 : ""),
                )}
                required={field.required}
                step={
                  field.name === "conversionRate"
                    ? "0.00001"
                    : field.name === "area"
                    ? "0.01"
                    : undefined
                }
                onChange={(e) => {
                  if (field.name === "mortgagePrice")
                    setMortgage(Number(e.target.value));
                }}
                aria-invalid={!!state.fields?.[field.name]}
                aria-describedby={
                  state.fields?.[field.name] ? `${field.name}-error` : undefined
                }
              />
            )}{" "}
            {field.hint && <small>{field.hint}</small>}
            {state.fields?.[field.name] && (
              <small className="field-error" id={`${field.name}-error`}>
                {state.fields[field.name].join("، ")}
              </small>
            )}
          </div>
        ))}
      </div>
      {kind === "property" && convertible && rate && (
        <div className="info-box">
          معادل اجارهٔ رهن واردشده:{" "}
          <b>{fa(Math.round(mortgage * rate))} تومان</b> در ماه؛ به‌علاوه اجاره
          ثبت‌شده.
        </div>
      )}
      {state.error && (
        <div
          className="field-error"
          role="alert"
          tabIndex={-1}
          ref={errorSummary}
        >
          {state.error}
          {state.fields && (
            <ul>
              {Object.entries(state.fields).map(([key, errors]) => (
                <li key={key}>
                  <a href={`#${key}`}>
                    {fields.find((f) => f.name === key)?.label}:{" "}
                    {errors.join("، ")}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="form-footer">
        <Submit />
        <Button type="button" variant="outline" onClick={() => router.back()}>
          انصراف
        </Button>
      </div>
    </form>
  );
}
const options = (items: string[]) =>
  items.map((value) => ({ value, label: value }));
export const ownerFields: Field[] = [
  { name: "fullName", label: "نام و نام خانوادگی", required: true },
  { name: "mobile", label: "شماره همراه", type: "tel", required: true },
  { name: "secondMobile", label: "شماره همراه دوم", type: "tel" },
  { name: "phone", label: "تلفن ثابت", type: "tel" },
  { name: "description", label: "توضیحات مالک", type: "textarea", wide: true },
];
export function propertyFields(
  owners: { id: string; fullName: string }[],
): Field[] {
  return [
    { name: "title", label: "عنوان فایل", required: true, wide: true },
    {
      name: "ownerId",
      label: "مالک",
      type: "select",
      options: [
        { value: "", label: "انتخاب مالک" },
        ...owners.map((o) => ({ value: o.id, label: o.fullName })),
      ],
      required: true,
    },
    {
      name: "transactionType",
      label: "نوع معامله",
      type: "select",
      options: [
        { value: "SALE", label: "فروش" },
        { value: "RENT", label: "اجاره" },
      ],
    },
    {
      name: "propertyType",
      label: "نوع ملک",
      type: "select",
      options: options(propertyTypes),
    },
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: ["ACTIVE", "RENTED", "SOLD", "INACTIVE", "ARCHIVED"].map(
        (value) => ({ value, label: statuses[value] }),
      ),
    },
    ...["city", "district", "neighborhood", "address"].map((name, i) => ({
      name,
      label: ["شهر", "منطقه", "محله", "آدرس"][i],
      required: name !== "district",
      wide: name === "address",
    })),
    ...[
      "area",
      "bedrooms",
      "floor",
      "totalFloors",
      "unitsPerFloor",
      "buildingAge",
    ].map((name, i) => ({
      name,
      label: [
        "متراژ (متر مربع)",
        "تعداد خواب",
        "طبقه",
        "تعداد طبقات",
        "واحد در هر طبقه",
        "سن بنا (سال)",
      ][i],
      type: "number",
      required: true,
    })),
    ...["parking", "storage", "elevator", "balcony"].map((name, i) => ({
      name,
      label: ["پارکینگ", "انباری", "آسانسور", "بالکن"][i],
      type: "checkbox",
    })),
    ...["salePrice", "mortgagePrice", "rentPrice"].map((name, i) => ({
      name,
      label: ["قیمت فروش (تومان)", "مبلغ رهن (تومان)", "اجاره ماهانه (تومان)"][
        i
      ],
      type: "number",
    })),
    {
      name: "isConvertible",
      label: "رهن و اجاره قابل تبدیل است",
      type: "checkbox",
    },
    {
      name: "conversionRate",
      label: "نرخ تبدیل",
      type: "number",
      hint: "برای محاسبه معادل قیمت فروش",
    },
    { name: "contactPhone", label: "تلفن تماس", type: "tel" },
    { name: "source", label: "منبع فایل" },
    { name: "sourceUrl", label: "لینک منبع", type: "url", wide: true },
    { name: "description", label: "توضیحات ملک", type: "textarea", wide: true },
    {
      name: "internalNotes",
      label: "یادداشت داخلی دفتر",
      type: "textarea",
      wide: true,
    },
  ];
}
