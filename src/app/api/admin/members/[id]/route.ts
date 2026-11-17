import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend-proxy';

async function forward(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyBackend(request, `/api/admin/members/${encodeURIComponent(id)}${request.nextUrl.search}`);
}
export const GET = forward;
export const PATCH = forward;
