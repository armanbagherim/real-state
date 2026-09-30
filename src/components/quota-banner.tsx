import { ShieldCheck, TriangleAlert } from "lucide-react";
import type { Quota } from "@/lib/billing";
import { fa } from "@/lib/utils";

export function QuotaBanner({ quota }: { quota: Quota }) {
  if (!quota.hasActive && !quota.hasSubscriptionHistory) return null;
  if (!quota.hasActive)
    return (
      <div className="quota-card warn">
        <span className="quota-icon">
          <TriangleAlert size={22} />
        </span>
        <div>
          <strong>اشتراک فعال نیست</strong>
          <p>{quota.reason}</p>
        </div>
      </div>
    );
  const pct =
    quota.limit > 0
      ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
      : 0;
  return (
    <div className="quota-card ok">
      <span className="quota-icon">
        <ShieldCheck size={22} />
      </span>
      <div className="quota-body">
        <div className="quota-head">
          <strong>اشتراک فعال دارید</strong>
          <span className="quota-chip">{fa(pct)}٪ استفاده‌شده</span>
        </div>
        <div className="quota-stats">
          <div className="quota-stat">
            <b>{fa(quota.remaining)}</b>
            <span>فایل باقی‌مانده</span>
          </div>
          <div className="quota-divider" />
          <div className="quota-stat">
            <b>{fa(quota.used)}</b>
            <span>فایل ثبت‌شده</span>
          </div>
          <div className="quota-divider" />
          <div className="quota-stat">
            <b>{fa(quota.limit)}</b>
            <span>سقف اشتراک</span>
          </div>
        </div>
        <div className="quota-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
