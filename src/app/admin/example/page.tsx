import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireAdminPage } from '@/lib/admin-session';
import { ExamplePage } from '@/components/admin/example/example-page';

export const metadata: Metadata = { title: 'หน้าตัวอย่าง | FUNCH Admin' };

async function ProtectedExamplePage() {
  await requireAdminPage();
  return <ExamplePage />;
}

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังโหลดระบบอนุมัติการจอง…</p>}><ProtectedExamplePage /></Suspense>;
}
