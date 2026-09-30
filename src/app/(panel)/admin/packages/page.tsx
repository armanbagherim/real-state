import { Package as PackageIcon } from "lucide-react";
import { PageHeading } from "@/components/page-parts";
import { getPackagesAdminData } from "@/repositories/billing-data";
import { PackageForm } from "@/components/billing-forms-admin-pkg";
import { DeletePackageButton } from "@/components/delete-package-button";
import { FormDialog } from "@/components/form-dialog";
import { money, fa } from "@/lib/utils";
import { notFound } from "next/navigation";

type Pkg = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  propertyLimit: number;
  agentLimit: number;
  color: string;
  badge: string;
  active: boolean;
};

export default async function AdminPackagesPage() {
  const data = await getPackagesAdminData();
  if (!data) notFound();
  return (
    <>
      <PageHeading
        title="مدیریت پکیج‌ها"
        description="پکیج‌های اشتراک، قیمت و سقف فایل و مشاور"
      >
        <span className="badge">
          <PackageIcon size={16} />
          {fa(data.packages.length)} پکیج
        </span>
        <FormDialog title="افزودن پکیج" triggerLabel="افزودن پکیج">
          <PackageForm />
        </FormDialog>
      </PageHeading>

      <section className="panel detail-panel">
        <h2>پکیج‌های تعریف‌شده</h2>
        {data.packages.length ? (
          <div className="package-grid">
            {data.packages.map((p) => (
              <article className="package-card" key={p.id}>
                <div className="package-card-head">
                  <h3>
                    <span
                      className="package-dot"
                      style={{ background: p.color }}
                    />
                    {p.name}
                  </h3>
                  <DeletePackageButton id={p.id} name={p.name} />
                </div>
                {p.badge && <span className="package-badge">{p.badge}</span>}
                {p.description && <p className="muted">{p.description}</p>}
                <div className="package-prices">
                  <div>
                    <b>{money(String(p.monthlyPrice))}</b>
                    <span>ماهانه</span>
                  </div>
                  <div>
                    <b>{money(String(p.yearlyPrice))}</b>
                    <span>سالانه</span>
                  </div>
                </div>
                <ul className="package-specs">
                  <li>تا {fa(p.propertyLimit)} فایل</li>
                  <li>تا {fa(p.agentLimit)} مشاور</li>
                  <li>{p.active ? "فعال" : "غیرفعال"}</li>
                  {p.internal && <li>داخلی</li>}
                </ul>
                <PackageForm pkg={p as Pkg} />
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">پکیجی تعریف نشده است.</p>
        )}
      </section>
    </>
  );
}
