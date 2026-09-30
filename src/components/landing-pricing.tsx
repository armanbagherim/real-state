"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { discountPercent, periods, priceFor, type Period } from "@/lib/billing";
import { fa, money } from "@/lib/utils";

type Plan = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  propertyLimit: number;
  agentLimit: number;
  badge: string;
  color: string;
};

function skeletons() {
  return [0, 1, 2].map((i) => (
    <div className="lp-plan sk" key={i} aria-hidden="true" />
  ));
}

export function LandingPricing() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [period, setPeriod] = useState<Period>("YEARLY");

  useEffect(() => {
    let alive = true;
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data: Plan[]) => alive && setPlans(data))
      .catch(() => alive && setPlans([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!plans) return <div className="lp-plans">{skeletons()}</div>;
  if (!plans.length) return null;

  return (
    <div className="lp-plans-wrap">
      <div className="lp-periods" role="tablist" aria-label="دوره اشتراک">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={period === p.value}
            className={`lp-period${period === p.value ? " on" : ""}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="lp-plans">
        {plans.map((plan, i) => {
          const featured = i === 1;
          const off = discountPercent(plan.monthlyPrice, plan.yearlyPrice);
          const amount = priceFor(plan, period);
          return (
            <article
              key={plan.name}
              className={`lp-plan${featured ? " featured" : ""}`}
              style={
                {
                  "--plan": plan.color,
                } as React.CSSProperties
              }
            >
              {plan.badge && (
                <span className="lp-plan-badge">
                  <Sparkles size={13} />
                  {plan.badge}
                </span>
              )}
              <div className="lp-plan-head">
                <span className="lp-plan-dot" />
                <h3>{plan.name}</h3>
              </div>
              {plan.description && <p>{plan.description}</p>}

              <div className="lp-plan-amount">
                <strong>{money(String(amount))}</strong>
                <span>{period === "YEARLY" ? "سالانه" : "ماهانه"}</span>
              </div>
              {period === "YEARLY" && off > 0 && (
                <span className="lp-plan-off">{fa(off)}٪ تخفیف سالانه</span>
              )}

              <ul className="lp-plan-specs">
                <li>
                  <Check size={16} />
                  تا {fa(plan.propertyLimit)} فایل
                </li>
                <li>
                  <Check size={16} />
                  تا {fa(plan.agentLimit)} مشاور
                </li>
              </ul>

              <Link className="lp-plan-cta" href="/buy">
                انتخاب {plan.name}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
