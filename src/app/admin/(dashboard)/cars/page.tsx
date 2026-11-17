import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin-session";
import { AdminCars } from "@/components/admin/admin-cars";

export const metadata: Metadata = { title: "จัดการรถยนต์ | FUNCH Admin" };

async function ProtectedCars() { await requireAdminPage(); return <AdminCars />; }

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังโหลดหน้าจัดการรถยนต์…</p>}><ProtectedCars /></Suspense>;
}
