import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackend(request, `/api/example/${id}${request.nextUrl.search}`);
}
