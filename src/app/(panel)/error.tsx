"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h2>بارگذاری اطلاعات انجام نشد</h2>
      <p>ارتباط با سرور را بررسی کنید و دوباره تلاش کنید.</p>
      <Button onClick={reset}>تلاش دوباره</Button>
    </div>
  );
}
