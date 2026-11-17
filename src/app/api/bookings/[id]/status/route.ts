import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyBackend(request, `/api/bookings/${encodeURIComponent(id)}/status`);
}
