import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend-proxy';

export function GET(request: NextRequest) {
  return proxyBackend(request, `/api/admin/members${request.nextUrl.search}`);
}
export function POST(request: NextRequest) {
  return proxyBackend(request, '/api/admin/members');
}
