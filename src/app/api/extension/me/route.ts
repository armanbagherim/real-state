import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { extensionOptions, extensionResponse } from "@/lib/extension-api";

export function OPTIONS(request: NextRequest) {
  return extensionOptions(request);
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user)
    return extensionResponse(request, { error: "احراز هویت منقضی شده است." }, { status: 401 });
  return extensionResponse(request, {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      officeId: user.officeId,
      officeName: user.office?.name ?? null,
    },
  });
}
