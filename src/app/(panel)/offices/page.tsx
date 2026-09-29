import { Building2, Check, X } from "lucide-react";
import { getOfficesData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { RecordAction } from "@/components/record-actions";
import { dateFa } from "@/lib/utils";

const officeFields: Field[] = [
  { name: "officeName", label: "نام املاک", required: true },
  { name: "officePhone", label: "تلفن", type: "tel" },
  { name: "officeAddress", label: "آدرس", wide: true },
  {
    name: "adminsCanViewAgentFiles",
    label: "مدیر املاک فایل‌های مشاورین را ببیند",
    type: "checkbox",
    hint: "خاموش باشد، مدیر فقط فایل‌های خودش و فایل‌های shareشده را می‌بیند.",
  },
];

export default async function OfficesPage() {
  const { offices } = await getOfficesData();
  return (
    <>
      <PageHeading
        title="مدیریت املاک"
        description="ثبت‌نام املاک را تأیید کنید و دسترسی مدیر هر املاک به فایل مشاورانش را تنظیم کنید."
      >
        <span className="badge">
          <Building2 size={16} />
          {offices.length} املاک
        </span>
      </PageHeading>
      <div className="stack-list">
        {offices.map((office) => {
          const owner = office.users[0];
          return (
            <section className="panel detail-panel" key={office.id}>
              <div className="row-between">
                <div>
                  <h2>{office.name}</h2>
                  <p className="muted">
                    مدیر: {owner?.name ?? "ثبت نشده"} · {owner?.mobile ?? "-"}
                  </p>
                </div>
                <span className={`badge badge-${owner?.status?.toLowerCase() ?? "pending"}`}>
                  {owner?.status === "APPROVED"
                    ? "تأییدشده"
                    : owner?.status === "REJECTED"
                    ? "ردشده"
                    : "در انتظار تأیید"}
                </span>
              </div>
              <p className="muted">
                {office._count.users} کاربر · {office._count.properties} فایل · ثبت {dateFa(office.createdAt)}
              </p>
              <RecordForm
                kind="office"
                fields={officeFields}
                hidden={{ officeId: office.id }}
                values={{
                  officeName: office.name,
                  officePhone: office.phone,
                  officeAddress: office.address,
                  adminsCanViewAgentFiles: office.adminsCanViewAgentFiles,
                }}
              />
              {owner && owner.status === "PENDING" && (
                <div className="action-wrap">
                  <RecordAction kind="office" id={office.id} action="approve">
                    <Check size={15} /> تأیید املاک
                  </RecordAction>
                  <RecordAction
                    kind="office"
                    id={office.id}
                    action="reject"
                    variant="destructive"
                    confirm
                  >
                    <X size={15} /> رد کردن
                  </RecordAction>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
