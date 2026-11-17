import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireAdminPage } from '@/lib/admin-session';
import { AdminMembers } from '@/components/admin/admin-members';

export const metadata: Metadata = { title: 'จัดการสมาชิก | FUNCH Admin' };

async function ProtectedMembers() {
  const member = await requireAdminPage();
  return <AdminMembers currentMemberId={member.id} />;
}

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังโหลดหน้าจัดการสมาชิก…</p>}><ProtectedMembers /></Suspense>;
}
