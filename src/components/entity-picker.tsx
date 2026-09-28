"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus, Search, UserPlus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
type Option = { value: string; label: string };
export function EntityPicker({
  name,
  value,
  initialOptions = [],
  required = false,
  kind,
}: {
  name: string;
  value: string;
  initialOptions?: Option[];
  required?: boolean;
  kind: "owners" | "properties" | "rent-properties";
}) {
  const initial = initialOptions.find((o) => o.value === value);
  const [selected, setSelected] = useState(value);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Option[]>(
    initialOptions.filter((o) => o.value).slice(0, 15),
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          `/api/options?kind=${kind}&q=${encodeURIComponent(query)}`,
          { signal: abort.signal },
        );
        if (!response.ok) throw Error();
        setResults(await response.json());
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [kind, query, open]);
  useEffect(() => {
    if (!value || initial) return;
    let active = true;
    fetch(`/api/options?kind=${kind}&id=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((data: Option[]) => {
        if (active && data[0]) setLabel(data[0].label);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [value, initial, kind]);
  return (
    <div className="entity-picker">
      <input type="hidden" name={name} value={selected} />
      <div className="entity-input">
        <Search size={16} />
        <input
          id={name}
          value={open ? query : label}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="جستجو و انتخاب…"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${name}-options`}
          aria-autocomplete="list"
          required={required && !selected}
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            aria-label="پاک کردن انتخاب"
            onClick={() => {
              setSelected("");
              setLabel("");
              setQuery("");
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>
      {kind === "owners" && (
        <button
          type="button"
          className="entity-inline-create"
          onClick={() => {
            setOpen(false);
            setOwnerOpen(true);
          }}
        >
          <span>
            <UserPlus size={16} />
          </span>
          ثبت مالک جدید در همین صفحه
        </button>
      )}
      {open && (
        <div id={`${name}-options`} className="entity-options" role="listbox">
          {loading ? (
            <p>در حال جستجو…</p>
          ) : error ? (
            <p role="alert">دریافت اطلاعات انجام نشد.</p>
          ) : results.length ? (
            results.map((o) => (
              <button
                type="button"
                role="option"
                aria-selected={selected === o.value}
                key={o.value}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelected(o.value);
                  setLabel(o.label);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            ))
          ) : (
            <p>موردی پیدا نشد.</p>
          )}
        </div>
      )}
      {kind === "owners" && (
        <Dialog.Root open={ownerOpen} onOpenChange={setOwnerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay" />
            <Dialog.Content className="dialog-card">
              <Dialog.Title>ثبت مالک جدید</Dialog.Title>
              <form
                className="record-form compact-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSavingOwner(true);
                  setOwnerError("");
                  const form = new FormData(event.currentTarget);
                  try {
                    const response = await fetch("/api/owners", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(Object.fromEntries(form)),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error);
                    setSelected(data.value);
                    setLabel(data.label);
                    setQuery("");
                    setResults((items) => [data, ...items]);
                    setOwnerOpen(false);
                  } catch (e) {
                    setOwnerError(
                      e instanceof Error ? e.message : "ثبت مالک انجام نشد.",
                    );
                  } finally {
                    setSavingOwner(false);
                  }
                }}
              >
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor={`${name}-owner-fullName`}>نام مالک</label>
                    <input id={`${name}-owner-fullName`} name="fullName" required />
                  </div>
                  <div className="field">
                    <label htmlFor={`${name}-owner-mobile`}>موبایل</label>
                    <input
                      id={`${name}-owner-mobile`}
                      name="mobile"
                      type="tel"
                      dir="ltr"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`${name}-owner-secondMobile`}>
                      موبایل دوم
                    </label>
                    <input
                      id={`${name}-owner-secondMobile`}
                      name="secondMobile"
                      type="tel"
                      dir="ltr"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`${name}-owner-phone`}>تلفن ثابت</label>
                    <input
                      id={`${name}-owner-phone`}
                      name="phone"
                      type="tel"
                      dir="ltr"
                    />
                  </div>
                  <div className="field field-wide">
                    <label htmlFor={`${name}-owner-description`}>توضیحات</label>
                    <textarea id={`${name}-owner-description`} name="description" />
                  </div>
                </div>
                {ownerError && <p className="field-error">{ownerError}</p>}
                <div className="form-footer">
                  <Button disabled={savingOwner} type="submit">
                    {savingOwner ? <Loader2 size={17} className="spin" /> : <Plus size={17} />}
                    ثبت و انتخاب مالک
                  </Button>
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline">
                      انصراف
                    </Button>
                  </Dialog.Close>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
