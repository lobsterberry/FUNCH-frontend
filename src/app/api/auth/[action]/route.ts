import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

type Context = { params: Promise<{ action: string }> };

export async function GET(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (!["session", "csrf", "me"].includes(action)) {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  return proxyBackend(request, `/api/auth/${action}`);
}

export async function POST(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (!["register", "login", "logout", "change-password"].includes(action)) {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  return proxyBackend(request, `/api/auth/${action}`);
}
