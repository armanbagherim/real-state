import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const settings = await db.settings.findFirstOrThrow({
    where: { OR: [{ officeId: user.officeId }, { id: "office" }] },
  });
  return (
    <Shell
      name={user.name}
      role={user.role}
      officeName={settings?.officeName ?? "دفتر املاک"}
    >
      {children}
    </Shell>
  );
}
