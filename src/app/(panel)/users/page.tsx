import { Users } from "lucide-react";
import { getUsersData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { dateFa } from "@/lib/utils";

const fields: Field[] = [
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
          {users.length} ادمین
        </span>
      </PageHeading>
      <section className="panel detail-panel">
        <h2>افزودن ادمین</h2>
        <RecordForm kind="admin" fields={fields} />
      </section>
      <section className="panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>ادمین</th>
                <th>موبایل</th>
                <th>وضعیت</th>
                <th>تاریخ ساخت</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td dir="ltr">{item.mobile}</td>
                  <td><span className="badge">فعال</span></td>
                  <td>{dateFa(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
