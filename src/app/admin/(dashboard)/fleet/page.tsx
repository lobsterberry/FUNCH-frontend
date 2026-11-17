import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdminPage } from "@/lib/admin-session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "รุ่นรถและสาขา | FUNCH Admin" };
async function ProtectedFleet() { await requireAdminPage(); return redirect("/admin/cars?view=model"); }
export default function Page() {
  return <Suspense fallback={<p role="status" className="p-8">กำลังโหลดรุ่นรถและสาขา…</p>}><ProtectedFleet /></Suspense>;
}
