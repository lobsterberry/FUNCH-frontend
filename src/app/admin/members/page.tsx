import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireAdminPage } from '@/lib/admin-session';
import { MembersManagement } from '@/components/admin/members/members-management';

export const metadata: Metadata = { title: 'จัดการสมาชิก | FUNCH Admin' };

async function ProtectedMembers() {
  const member = await requireAdminPage();
  return <MembersManagement currentMemberId={member.id} />;
}

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังโหลดหน้าจัดการสมาชิก…</p>}><ProtectedMembers /></Suspense>;
}
