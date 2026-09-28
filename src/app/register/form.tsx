"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { register, type RegisterState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const initialState: RegisterState = {
    error: "",
    success: "",
    fields: {},
    values: {},
  };
  const [state, action, pending] = useActionState(register, initialState);
  const [visible, setVisible] = useState(false);
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
  const value = (name: string) => state.values?.[name] ?? "";
  return (
    <form action={action} className="login-form" ref={formRef}>
      <div className="field">
        <label htmlFor="name">نام مدیر املاک</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          defaultValue={value("name")}
        />
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
        {state.fields?.mobile && <small className="field-error">{state.fields.mobile.join("، ")}</small>}
      </div>
      <div className="field">
        <label htmlFor="officeName">نام املاک</label>
        <input
          id="officeName"
          name="officeName"
          required
          defaultValue={value("officeName")}
        />
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
        {state.fields?.password && <small className="field-error">{state.fields.password.join("، ")}</small>}
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
          <small className="field-error">{state.fields.confirmPassword.join("، ")}</small>
        )}
      </div>
      {state.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      {state.success && <p className="success-note">{state.success}</p>}
      <Button disabled={pending} type="submit">
        {pending ? <Loader2 className="spin" size={19} /> : <UserPlus size={18} />}
        ثبت‌نام و ارسال برای تأیید
      </Button>
      <p className="auth-switch">
        قبلاً ثبت‌نام کرده‌اید؟ <Link href="/login">ورود</Link>
      </p>
    </form>
  );
}
