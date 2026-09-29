import { UserPlus, Trash2 } from "lucide-react";
import { getAgentsData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { RecordAction } from "@/components/record-actions";
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

export default async function AgentsPage() {
  const { agents } = await getAgentsData();
  return (
    <>
      <PageHeading
        title="مشاورین"
        description="مشاوران این املاک را اضافه یا حذف کنید. مشاور پس از ساخت، بلافاصله امکان ورود دارد."
      >
        <span className="badge">
          <UserPlus size={16} />
          {agents.length} مشاور
        </span>
      </PageHeading>
      <section className="panel detail-panel">
        <h2>افزودن مشاور</h2>
        <RecordForm kind="agent" fields={fields} />
      </section>
      <section className="panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>مشاور</th>
                <th>موبایل</th>
                <th>وضعیت</th>
                <th>تاریخ اضافه‌شدن</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td><strong>{agent.name}</strong></td>
                  <td dir="ltr">{agent.mobile}</td>
                  <td><span className="badge">فعال</span></td>
                  <td>{dateFa(agent.createdAt)}</td>
                  <td>
                    <RecordAction
                      kind="agent"
                      id={agent.id}
                      action="delete"
                      variant="destructive"
                      confirm
                    >
                      <Trash2 size={15} />
                      حذف
                    </RecordAction>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!agents.length && <p className="muted">هنوز مشاوری برای این املاک ثبت نشده است.</p>}
      </section>
    </>
  );
}
