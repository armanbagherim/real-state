import { NextRequest, NextResponse } from "next/server";

export function extensionCors(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const configured = process.env.CHROME_EXTENSION_ID
    ? `chrome-extension://${process.env.CHROME_EXTENSION_ID}`
    : "";
  const allowed = configured
    ? origin === configured
      ? origin
      : null
    : origin.startsWith("chrome-extension://")
    ? origin
    : null;
  return {
    ...(allowed ? { "Access-Control-Allow-Origin": allowed } : {}),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
}

export function extensionResponse(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...extensionCors(request), ...(init?.headers ?? {}) },
  });
}

export function extensionOptions(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: extensionCors(request) });
}
