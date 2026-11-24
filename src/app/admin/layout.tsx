import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { requireAdminPage } from "@/lib/admin-session";
import { AdminLayout } from "@/components/admin/layout/admin-layout";

async function ProtectedLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const member = await requireAdminPage();
  return <AdminLayout member={member}>{children}</AdminLayout>;
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p role="status" className="p-8 text-sm text-slate-500">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ…</p>}>
      <ProtectedLayout>{children}</ProtectedLayout>
    </Suspense>
  );
}
