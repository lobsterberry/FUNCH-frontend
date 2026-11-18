import { Suspense } from 'react';
import { connection } from 'next/server';
import { AdminReports } from '@/components/admin/admin-reports';

export const metadata = { title: 'รายงานสรุปยอดจองรถ | FUNCH Admin' };

async function ReportPage() {
  await connection();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return <AdminReports today={today} />;
}

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังเตรียมรายงาน…</p>}><ReportPage /></Suspense>;
}
