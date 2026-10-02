import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { extensionOptions, extensionResponse } from "@/lib/extension-api";

export function OPTIONS(request: NextRequest) {
  return extensionOptions(request);
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user)
    return extensionResponse(
      request,
      { error: "احراز هویت منقضی شده است." },
      { status: 401 },
    );
  const folders = await db.filingFolder.findMany({
    where: isSuperAdmin(user) ? {} : { officeId: user.officeId ?? "__none__" },
    select: { id: true, name: true, color: true, parentId: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
  });
  return extensionResponse(request, {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      officeId: user.officeId,
      officeName: user.office?.name ?? null,
    },
    folders,
  });
}
