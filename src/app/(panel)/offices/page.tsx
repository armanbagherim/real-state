import { Building2, Check, X } from "lucide-react";
import { getOfficesData } from "@/repositories/office";
import { PageHeading, Badge } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { RecordAction } from "@/components/record-actions";
import { EditRecordDialog } from "@/components/edit-record-dialog";
import { FormDialog } from "@/components/form-dialog";
import { dateFa, fa } from "@/lib/utils";

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
          {fa(offices.length)} املاک
        </span>
        <FormDialog title="ثبت‌نام املاک" triggerLabel="افزودن املاک">
          <RecordForm kind="office-new" fields={officeFields} />
        </FormDialog>
      </PageHeading>

      <section className="panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>املاک</th>
                <th>مدیر</th>
                <th>موبایل</th>
                <th>کاربران</th>
                <th>فایل‌ها</th>
                <th>وضعیت</th>
                <th>ثبت</th>
                <th>
                  <span className="sr-only">ویرایش</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {offices.map((office) => {
                const owner = office.users[0];
                return (
                  <tr key={office.id}>
                    <td>
                      <strong>{office.name}</strong>
                    </td>
                    <td>{owner?.name ?? "ثبت نشده"}</td>
                    <td dir="ltr">{owner?.mobile ?? "-"}</td>
                    <td>{fa(office._count.users)}</td>
                    <td>{fa(office._count.properties)}</td>
                    <td>
                      <Badge value={owner?.status ?? "PENDING"} />
                    </td>
                    <td>{dateFa(office.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        {owner && owner.status === "PENDING" && (
                          <>
                            <RecordAction
                              kind="office"
                              id={office.id}
                              action="approve"
                            >
                              <Check size={15} /> تأیید
                            </RecordAction>
                            <RecordAction
                              kind="office"
                              id={office.id}
                              action="reject"
                              variant="destructive"
                              confirm
                            >
                              <X size={15} /> رد
                            </RecordAction>
                          </>
                        )}
                        <EditRecordDialog
                          kind="office"
                          title={`ویرایش ${office.name}`}
                          label={`ویرایش ${office.name}`}
                          fields={officeFields}
                          hidden={{ officeId: office.id }}
                          values={{
                            officeName: office.name,
                            officePhone: office.phone,
                            officeAddress: office.address,
                            adminsCanViewAgentFiles:
                              office.adminsCanViewAgentFiles,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
