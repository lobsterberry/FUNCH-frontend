import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireAdminPage } from '@/lib/admin-session';
import { BookingsManagement } from '@/components/admin/bookings/bookings-management';

export const metadata: Metadata = { title: 'ระบบอนุมัติการจอง | FUNCH Admin' };

async function ProtectedBookings() {
  await requireAdminPage();
  return <BookingsManagement />;
}

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังโหลดระบบอนุมัติการจอง…</p>}><ProtectedBookings /></Suspense>;
}
