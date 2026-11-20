"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Member } from "@/lib/account";
import { AdminSidebar } from "./admin-sidebar";
import { AdminNavbar } from "./admin-navbar";
import { CarsManagementProvider } from "./cars-management-context";

export function AdminLayout({
  member,
  children,
}: {
  member: Member;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  return (
    <CarsManagementProvider>
      <div className="min-h-dvh bg-slate-100 lg:pl-64">
        <a
          href="#admin-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:z-50 focus:bg-white focus:p-3"
        >
          ข้ามไปเนื้อหา
        </a>
        <AdminSidebar
          member={member}
          open={open}
          onClose={() => setOpen(false)}
        />
        <AdminNavbar menuOpen={open} onMenu={() => setOpen(true)} />
        <main id="admin-content" className="mx-auto max-w-[1600px] p-4 sm:p-8">
          {children}
        </main>
      </div>
    </CarsManagementProvider>
  );
}
