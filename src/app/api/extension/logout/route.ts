import { NextRequest } from "next/server";
import { revokeBearerSession } from "@/lib/auth";
import { extensionOptions, extensionResponse } from "@/lib/extension-api";

export function OPTIONS(request: NextRequest) {
  return extensionOptions(request);
}

export async function POST(request: NextRequest) {
  await revokeBearerSession(request);
  return extensionResponse(request, { ok: true });
}
