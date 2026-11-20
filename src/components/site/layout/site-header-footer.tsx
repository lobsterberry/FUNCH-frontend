"use client";

import Link from "next/link";
import { useState } from "react";
import type { Member } from "@/lib/account";

export function scrollHomeTop() {
  if (typeof window !== "undefined" && window.location.pathname === "/") {
    if (window.location.hash) {
      window.history.replaceState(null, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

export function Header({
  search,
  onAuth,
  member,
  sessionLoading,
  loggingOut,
  onLogout,
}: {
  search: boolean;
  onAuth: (tab: "login" | "register") => void;
  member: Member | null;
  sessionLoading: boolean;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/", label: "หน้าแรก", active: !search },
    { href: "/search", label: "ค้นหารถทั้งหมด", active: search },
    { href: "/#popular-destinations", label: "ประเทศที่ให้บริการ" },
    { href: "/#pricing-rules-info", label: "กฎการคิดราคา" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:bg-white focus:p-4"
      >
        ข้ามไปเนื้อหาหลัก
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            onClick={scrollHomeTop}
            aria-label="FUNCH Drive หน้าแรก"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-sm">
              F
            </span>
            <span>
              <span className="flex items-center text-xl font-bold tracking-tight text-slate-900">
                FUNCH{" "}
                <span className="ml-1 text-base font-semibold text-blue-600">
                  Drive
                </span>
              </span>
              <span className="-mt-1 block text-[10px] tracking-wider text-slate-400">
                GLOBAL CAR RENTAL
              </span>
            </span>
          </Link>
          <nav
            aria-label="เมนูหลัก"
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 xl:flex"
          >
            {links.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                onClick={link.href === "/" ? scrollHomeTop : undefined}
                aria-current={link.active ? "page" : undefined}
                className={`flex items-center gap-1 py-5 transition hover:text-blue-600 ${link.active ? "border-b-2 border-blue-600 text-blue-600" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <label className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 md:flex">
            <span className="mr-1.5 text-slate-400">สกุลเงิน:</span>
            <select
              aria-label="สกุลเงิน"
              className="bg-transparent font-semibold"
            >
              <option>THB (฿)</option>
            </select>
          </label>
          <span className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 sm:flex">
            🇹🇭 <span className="font-medium">TH</span>
          </span>
          {sessionLoading ? (
            <span className="text-xs text-slate-500">กำลังตรวจสอบบัญชี…</span>
          ) : member ? (
            <>
              <span
                className="hidden max-w-40 truncate text-xs font-semibold text-blue-700 sm:block"
                title={member.email}
              >
                {member.name}
              </span>
              <button
                onClick={onLogout}
                disabled={loggingOut}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 disabled:opacity-50"
              >
                {loggingOut ? "กำลังออก…" : "ออกจากระบบ"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onAuth("login")}
                className="hidden px-2 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 sm:block"
              >
                เข้าสู่ระบบ
              </button>
              <button
                onClick={() => onAuth("register")}
                className="btn-primary rounded-lg px-3 py-2 text-xs shadow-sm sm:px-4 sm:text-sm"
              >
                สมัครสมาชิก
              </button>
            </>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="เปิดเมนู"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 xl:hidden"
          >
            ☰
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="เมนูมือถือ"
          className="space-y-1 border-t border-slate-100 bg-white p-4 xl:hidden"
        >
          {member && (
            <p className="px-3 py-2 text-sm font-semibold text-blue-700">
              {member.name}
            </p>
          )}
          {links.map((link) => (
            <Link
              onClick={() => {
                setMenuOpen(false);
                if (link.href === "/") {
                  scrollHomeTop();
                }
              }}
              href={link.href}
              key={link.href}
              className={`block rounded-lg px-3 py-2 text-sm ${link.active ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {link.label}
            </Link>
          ))}
          {!member && !sessionLoading && (
            <button
              className="px-3 py-2 text-sm text-blue-600"
              onClick={() => {
                setMenuOpen(false);
                onAuth("login");
              }}
            >
              เข้าสู่ระบบ
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-8 text-xs text-slate-500 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <strong className="text-slate-800">FUNCH Car Rental System</strong>
          <span>•</span>
          <span>เดินทางอย่างมั่นใจ ในทุกจุดหมาย</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={scrollHomeTop}
            className="text-blue-600 hover:underline"
          >
            หน้าแรก
          </Link>
          <Link href="/search" className="text-blue-600 hover:underline">
            ค้นหารถทั้งหมด
          </Link>
          <Link
            href="/#pricing-rules-info"
            className="text-blue-600 hover:underline"
          >
            เงื่อนไขการเช่า
          </Link>
        </div>
      </div>
    </footer>
  );
}
