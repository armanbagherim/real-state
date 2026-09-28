import { UserCog } from "lucide-react";
import { getUsersData } from "@/repositories/office";
import { PageHeading } from "@/components/page-parts";
import type { Field } from "@/components/forms";
import { UserManagementDialog } from "@/components/user-management-dialog";
import { dateFa } from "@/lib/utils";

export default async function UsersPage() {
  const { user, users, offices } = await getUsersData();
  const fields = (officeId?: string | null): Field[] => [
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: [
        { value: "PENDING", label: "در انتظار تأیید" },
        { value: "APPROVED", label: "تأیید شده" },
        { value: "REJECTED", label: "رد شده" },
      ],
    },
    {
      name: "role",
      label: "نقش",
      type: "select",
      options: [
        { value: "OFFICE_ADMIN", label: "مدیر دفتر" },
        { value: "AGENT", label: "مشاور" },
      ],
    },
    ...(user.role === "SUPER_ADMIN"
      ? [
          {
            name: "officeId",
            label: "دفتر",
            type: "select",
            options: [
              { value: officeId ?? "", label: "بدون دفتر" },
              ...offices.map((o) => ({ value: o.id, label: o.name })),
            ],
          } satisfies Field,
        ]
      : []),
  ];
  return (
    <>
      <PageHeading
        title="مدیریت کاربران"
        description="ثبت‌نام‌های جدید را تأیید کنید و نقش کاربران هر دفتر را تنظیم کنید."
      >
        <span className="badge">
          <UserCog size={16} />
          {users.filter((u) => u.status === "PENDING").length} در انتظار
        </span>
      </PageHeading>
      <section className="panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>کاربر</th>
                <th>موبایل</th>
                <th>دفتر</th>
                <th>ثبت‌نام</th>
                <th>مدیریت</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.status}</small>
                  </td>
                  <td dir="ltr">{item.mobile}</td>
                  <td>{item.office?.name ?? "بدون دفتر"}</td>
                  <td>{dateFa(item.createdAt)}</td>
                  <td>
                    {item.role === "SUPER_ADMIN" ? (
                      <span className="badge">مدیر کل</span>
                    ) : (
                      <UserManagementDialog
                        userId={item.id}
                        name={item.name}
                        fields={fields(item.officeId)}
                        values={{
                          status: item.status,
                          role: item.role,
                          officeId: item.officeId ?? "",
                        }}
                      />
                    )}
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
