"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Member } from "@/lib/account";
import { AdminIcon } from "./admin-icon";
import { useAdminFleet } from "./admin-fleet-context";

export function AdminSidebar({
  member,
  open,
  onClose,
}: {
  member: Member;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { network } = useAdminFleet();
  return (
    <>
      {open && (
        <button
          aria-label="ปิดเมนู"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-800 bg-slate-950 px-5">
          <Link
            href="/admin/cars"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
              F
            </span>
            <span>
              <span className="font-bold text-white">
                FUNCH{" "}
                <span className="ml-1 rounded bg-blue-950 px-1.5 py-1 text-[10px] text-blue-400">
                  ADMIN V2
                </span>
              </span>
              <span className="mt-1 block text-[10px] text-slate-400">
                Fleet & Location Management
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="ปิดเมนู"
            className="ml-auto text-xl lg:hidden"
          >
            ×
          </button>
        </div>
        <div className="border-b border-slate-800 bg-slate-800/40 px-5 py-4">
          <p className="text-[11px] text-slate-400">เครือข่ายรถยนต์ทั่วโลก</p>
          <p className="mt-1 text-xs font-medium text-emerald-400">
            {network
              ? `${network.summary.locations} สาขาใน ${network.summary.countries} ประเทศ`
              : "FUNCH Global Fleet"}
          </p>
          {network && (
            <div className="mt-2 flex flex-wrap gap-2 text-lg">
              {network.countries.map((country) => (
                <span key={country.code} title={country.name}>
                  {country.flag}
                </span>
              ))}
            </div>
          )}
        </div>
        <nav aria-label="เมนูหลังบ้าน" className="flex-1 space-y-2 px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-widest text-slate-500">
            เมนูหลัก
          </p>
          <Link
            href="/admin/cars"
            onClick={onClose}
            aria-current={pathname === "/admin/cars" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${pathname === "/admin/cars" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "hover:bg-slate-800"}`}
          >
            <AdminIcon name="car" />
            จัดการข้อมูลรถยนต์
          </Link>
          <Link
            href="/admin/bookings"
            onClick={onClose}
            aria-current={pathname === "/admin/bookings" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${pathname === "/admin/bookings" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "hover:bg-slate-800"}`}
          >
            <AdminIcon name="booking" />
            อนุมัติการจอง
          </Link>
          <Link
            href="/admin/members"
            onClick={onClose}
            aria-current={pathname === "/admin/members" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${pathname === "/admin/members" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "hover:bg-slate-800"}`}
          >
            <AdminIcon name="users" />
            จัดการสมาชิก
          </Link>
          <Link
            href="/admin/reports"
            onClick={onClose}
            aria-current={pathname === "/admin/reports" ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${pathname === "/admin/reports" ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "hover:bg-slate-800"}`}
          >
            <AdminIcon name="report" />
            รายงานสรุปยอดจอง
          </Link>
          <div className="pt-6">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-slate-500">
              ทางลัด
            </p>
            <Link
              href="/"
              className="block rounded-xl px-3 py-3 text-xs hover:bg-slate-800"
            >
              ↗ ไปหน้าเว็บไซต์ลูกค้า
            </Link>
          </div>
        </nav>
        <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-950/40 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {member.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">
              {member.name}
            </span>
            <span className="block truncate text-[11px] text-slate-400">
              {member.email}
            </span>
          </span>
        </div>
      </aside>
    </>
  );
}
