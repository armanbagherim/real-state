import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <Shell
      name={user.name}
      role={user.role}
      officeName={
        user.role === "SUPER_ADMIN"
          ? "مدیریت کل"
          : user.office?.name ?? "بدون املاک"
      }
    >
      {children}
    </Shell>
  );
}
