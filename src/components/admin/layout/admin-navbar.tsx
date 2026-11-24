"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/account";
import { AdminIcon } from "./admin-icon";

type AdminPageLabel = {
  title: string;
  badge?: string;
};

const adminPageLabels: ReadonlyMap<string, AdminPageLabel> = new Map([
  ["cars", { title: "จัดการข้อมูลรถยนต์", badge: "Cars Across Locations" }],
  ["bookings", { title: "ระบบอนุมัติการจอง", badge: "Booking Approval System" }],
  ["members", { title: "จัดการสมาชิก", badge: "Member Management" }],
  ["reports", { title: "รายงานสรุปยอดจองรถ", badge: "Analytics & Financial Report" }],
  // ["example", { title: "หน้าตัวอย่าง", badge: "Example Page" }],
]);

export function AdminNavbar({
  onMenu,
  menuOpen,
}: {
  onMenu: () => void;
  menuOpen: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const section = pathname.split("/")[2] ?? "";
  const label = adminPageLabels.get(section);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await signOut();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
      setBusy(false);
    }
  }
  return (
    <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="เปิดเมนูหลังบ้าน"
          aria-controls="admin-sidebar"
          aria-expanded={menuOpen}
          className="rounded-lg border border-slate-200 p-2 lg:hidden"
        >
          <AdminIcon name="menu" />
        </button>
        <div>
          <p className="text-[11px] text-slate-400">
            FUNCH <span className="mx-2">/</span> ระบบหลังบ้าน
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            {label?.title ?? "ระบบหลังบ้าน"}{" "}
            {label?.badge && (
              <span className="ml-2 hidden rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-normal text-blue-700 sm:inline">
                {label.badge}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700 sm:block">
          ผู้ดูแลระบบ
        </span>
        <button
          onClick={logout}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
        >
          <AdminIcon name="logout" className="h-4 w-4" />
          {busy ? "กำลังออก…" : "ออกจากระบบ"}
        </button>
      </div>
      {error && (
        <p role="alert" className="w-full text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </header>
  );
}
