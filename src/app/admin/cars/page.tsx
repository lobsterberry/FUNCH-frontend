import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin-session";
import { CarsManagement } from "@/components/admin/cars/cars-management";

export const metadata: Metadata = { title: "รุ่นรถและฝูงรถยนต์ | FUNCH Admin" };

async function ProtectedCars() { await requireAdminPage(); return <CarsManagement />; }

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังโหลดหน้าจัดการรถยนต์…</p>}><ProtectedCars /></Suspense>;
}
