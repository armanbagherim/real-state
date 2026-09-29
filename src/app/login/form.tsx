"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="login-form">
      <div className="field">
        <label htmlFor="username">نام کاربری</label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          dir="ltr"
          placeholder="نام کاربری شما"
        />
      </div>
      <div className="field">
        <label htmlFor="password">رمز عبور</label>
        <div className="password-wrap">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            dir="ltr"
          />
          <button
            type="button"
            aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>
      </div>
      {state.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      <Button disabled={pending} type="submit">
        {pending ? (
          <Loader2 className="spin" size={19} />
        ) : (
          "ورود به پنل مدیریت"
        )}
        <ArrowLeft size={18} />
      </Button>
      <p className="auth-switch">
        حساب ندارید؟ <Link href="/register">ثبت‌نام املاک</Link>
      </p>
      <p className="auth-switch">
        افزونه وارد کردن فایل؟ <Link href="/extension">راهنمای نصب افزونه</Link>
      </p>
    </form>
  );
}
