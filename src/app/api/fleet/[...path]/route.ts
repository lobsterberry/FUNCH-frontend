import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend-proxy';

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyBackend(request, `/api/fleet/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`);
}
export const GET = forward;
export const POST = forward;
export const PATCH = forward;
