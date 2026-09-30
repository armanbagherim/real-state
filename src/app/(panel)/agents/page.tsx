import { UserPlus, Trash2 } from "lucide-react";
import { getAgentsData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import { RecordForm, type Field } from "@/components/forms";
import { RecordAction } from "@/components/record-actions";
import { EditRecordDialog } from "@/components/edit-record-dialog";
import { FormDialog } from "@/components/form-dialog";
import { dateFa, fa } from "@/lib/utils";

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

const editFields: Field[] = [
  { name: "name", label: "نام و نام خانوادگی", required: true },
  { name: "mobile", label: "شماره موبایل", type: "tel", required: true },
  {
    name: "commissionPercent",
    label: "درصد کمیسیون",
    type: "number",
    hint: "درصدی از هر فروش اشتراک که با کد معرف این شخص انجام شود",
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
          {fa(agents.length)} مشاور
        </span>
        <FormDialog title="افزودن مشاور" triggerLabel="افزودن مشاور">
          <RecordForm kind="agent" fields={fields} />
        </FormDialog>
      </PageHeading>
      <section className="panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>مشاور</th>
                <th>موبایل</th>
                <th>کد معرف</th>
                <th>کمیسیون</th>
                <th>تاریخ اضافه‌شدن</th>
                <th>حذف</th>
                <th>
                  <span className="sr-only">ویرایش</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id}>
                  <td>
                    <strong>{agent.name}</strong>
                  </td>
                  <td dir="ltr">{agent.mobile}</td>
                  <td dir="ltr">
                    <code className="ref-code">
                      {agent.referralCode?.code ?? "—"}
                    </code>
                  </td>
                  <td>
                    <span
                      className={`percent-pill${
                        agent.commissionPercent ? " on" : ""
                      }`}
                    >
                      {fa(agent.commissionPercent)}٪
                    </span>
                  </td>
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
                  <td>
                    <EditRecordDialog
                      kind="agent-edit"
                      title={`ویرایش ${agent.name}`}
                      label={`ویرایش ${agent.name}`}
                      fields={editFields}
                      hidden={{ userId: agent.id }}
                      values={{
                        name: agent.name,
                        mobile: agent.mobile,
                        commissionPercent: agent.commissionPercent,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!agents.length && (
          <p className="muted">هنوز مشاوری برای این املاک ثبت نشده است.</p>
        )}
      </section>
    </>
  );
}
