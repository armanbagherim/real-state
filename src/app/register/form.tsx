"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { register, type RegisterState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const STEPS = ["دفتر املاک", "مدیر دفتر", "رمز عبور"];
const FIELD_STEP: Record<string, number> = {
  officeName: 0,
  officePhone: 0,
  officeAddress: 0,
  name: 1,
  mobile: 1,
  password: 2,
  confirmPassword: 2,
};

function errorStepFor(fields?: Record<string, string[]>) {
  if (!fields) return 0;
  let target = 0;
  for (const name of Object.keys(fields))
    target = Math.max(target, FIELD_STEP[name] ?? 0);
  return target;
}

export function RegisterForm() {
  const initialState: RegisterState = {
    error: "",
    success: "",
    fields: {},
    values: {},
  };
  const [state, action, pending] = useActionState(register, initialState);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.values || !formRef.current) return;
    for (const [name, value] of Object.entries(state.values)) {
      const element = formRef.current.elements.namedItem(name);
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement
      )
        element.value = value;
    }
  }, [state.values]);
  const shown = Math.max(step, errorStepFor(state.fields));
  const value = (name: string) => state.values?.[name] ?? "";
  return (
    <>
      <ol className="stepper" aria-label="مراحل ثبت‌نام">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === shown ? "active" : i < shown ? "done" : ""}
            aria-current={i === shown ? "step" : undefined}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <form action={action} className="login-form" ref={formRef}>
        <div style={{ display: shown === 0 ? "block" : "none" }}>
          <div className="field">
            <label htmlFor="officeName">نام املاک</label>
            <input
              id="officeName"
              name="officeName"
              required
              defaultValue={value("officeName")}
            />
            {state.fields?.officeName && (
              <small className="field-error">
                {state.fields.officeName.join("، ")}
              </small>
            )}
          </div>
          <div className="field">
            <label htmlFor="officePhone">تلفن دفتر</label>
            <input
              id="officePhone"
              name="officePhone"
              type="tel"
              dir="ltr"
              defaultValue={value("officePhone")}
            />
          </div>
          <div className="field">
            <label htmlFor="officeAddress">آدرس دفتر</label>
            <input
              id="officeAddress"
              name="officeAddress"
              defaultValue={value("officeAddress")}
            />
          </div>
        </div>

        <div style={{ display: shown === 1 ? "block" : "none" }}>
          <div className="field">
            <label htmlFor="name">نام مدیر املاک</label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              defaultValue={value("name")}
            />
            {state.fields?.name && (
              <small className="field-error">
                {state.fields.name.join("، ")}
              </small>
            )}
          </div>
          <div className="field">
            <label htmlFor="mobile">شماره موبایل</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="09123456789"
              required
              defaultValue={value("mobile")}
            />
            {state.fields?.mobile && (
              <small className="field-error">
                {state.fields.mobile.join("، ")}
              </small>
            )}
          </div>
          <div className="field">
            <label htmlFor="referralCode">کد معرف (اختیاری)</label>
            <input
              id="referralCode"
              name="referralCode"
              type="text"
              dir="ltr"
              placeholder="اگر از معرفی دوستان آمده‌اید"
              defaultValue={value("referralCode")}
            />
          </div>
        </div>

        <div style={{ display: shown === 2 ? "block" : "none" }}>
          <div className="field">
            <label htmlFor="password">رمز عبور قوی</label>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                required
                dir="ltr"
                defaultValue={value("password")}
              />
              <button
                type="button"
                aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <small>حداقل ۱۰ کاراکتر، شامل حرف انگلیسی، عدد و نشانه.</small>
            {state.fields?.password && (
              <small className="field-error">
                {state.fields.password.join("، ")}
              </small>
            )}
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">تکرار رمز عبور</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              dir="ltr"
              defaultValue={value("confirmPassword")}
            />
            {state.fields?.confirmPassword && (
              <small className="field-error">
                {state.fields.confirmPassword.join("، ")}
              </small>
            )}
          </div>
          <div className="stepper-review">
            <span>
              <b>املاک:</b> {value("officeName") || "—"}
            </span>
            <span>
              <b>مدیر:</b> {value("name") || "—"}
            </span>
            <span dir="ltr">
              <b>موبایل:</b> {value("mobile") || "—"}
            </span>
          </div>
        </div>

        {state.error && (
          <p role="alert" className="field-error">
            {state.error}
          </p>
        )}
        {state.success && <p className="success-note">{state.success}</p>}

        <div className="stepper-actions">
          {shown > 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(shown - 1)}
              disabled={pending}
            >
              مرحله قبل
            </Button>
          )}
          {shown < 2 ? (
            <Button type="button" onClick={() => setStep(shown + 1)}>
              بعدی
            </Button>
          ) : (
            <Button disabled={pending} type="submit">
              {pending ? (
                <Loader2 className="spin" size={19} />
              ) : (
                <UserPlus size={18} />
              )}
              ثبت‌نام و ارسال برای تأیید
            </Button>
          )}
        </div>
      </form>
      <p className="auth-switch">
        قبلاً ثبت‌نام کرده‌اید؟ <Link href="/login">ورود</Link>
      </p>
    </>
  );
}
