import { Users } from "lucide-react";
import { getUsersData } from "@/repositories/office";
import { PageHeading, Badge } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { EditRecordDialog } from "@/components/edit-record-dialog";
import { FormDialog } from "@/components/form-dialog";
import { dateFa, fa } from "@/lib/utils";

const createFields: Field[] = [
  { name: "name", label: "نام و نام خانوادگی", required: true },
  { name: "mobile", label: "شماره موبایل", type: "tel", required: true },
  {
    name: "password",
    label: "رمز عبور",
    type: "password",
    required: true,
    hint: "حداقل ۱۰ کاراکتر، شامل حرف انگلیسی، عدد و نشانه",
  },
];

const editFields: Field[] = [
  { name: "name", label: "نام و نام خانوادگی", required: true },
  { name: "mobile", label: "شماره موبایل", type: "tel", required: true },
  {
    name: "commissionPercent",
    label: "درصد کمیسیون",
    type: "number",
    hint: "درصدی از هر فروش اشتراک که با کد معرف شما انجام شود",
  },
  {
    name: "status",
    label: "وضعیت",
    type: "select",
    options: [
      { value: "APPROVED", label: "فعال" },
      { value: "PENDING", label: "در انتظار تأیید" },
      { value: "REJECTED", label: "رد شده" },
    ],
  },
];

export default async function UsersPage() {
  const { users } = await getUsersData();
  return (
    <>
      <PageHeading
        title="ادمین‌ها"
        description="کاربران مدیریتی سیستم را مدیریت کنید. این بخش از املاک و مشاوران جداست."
      >
        <span className="badge">
          <Users size={16} />
          {fa(users.length)} ادمین
        </span>
        <FormDialog title="افزودن ادمین" triggerLabel="افزودن ادمین">
          <RecordForm kind="admin" fields={createFields} />
        </FormDialog>
      </PageHeading>

      <section className="panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>ادمین</th>
                <th>موبایل</th>
                <th>کد معرف</th>
                <th>کمیسیون</th>
                <th>وضعیت</th>
                <th>تاریخ ساخت</th>
                <th>
                  <span className="sr-only">ویرایش</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td dir="ltr">{item.mobile}</td>
                  <td dir="ltr">
                    <code className="ref-code">
                      {item.referralCode?.code ?? "—"}
                    </code>
                  </td>
                  <td>
                    <span
                      className={`percent-pill${
                        item.commissionPercent ? " on" : ""
                      }`}
                    >
                      {fa(item.commissionPercent)}٪
                    </span>
                  </td>
                  <td>
                    <Badge value={item.status} />
                  </td>
                  <td>{dateFa(item.createdAt)}</td>
                  <td>
                    <EditRecordDialog
                      kind="admin-edit"
                      title={`ویرایش ${item.name}`}
                      label={`ویرایش ${item.name}`}
                      fields={editFields}
                      hidden={{ userId: item.id }}
                      values={{
                        name: item.name,
                        mobile: item.mobile,
                        status: item.status,
                        commissionPercent: item.commissionPercent,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
