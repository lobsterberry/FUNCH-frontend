"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { currentMember, signIn } from "@/lib/account";
import { AdminIcon } from "./layout/admin-icon";

export function AdminLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    let active = true;
    currentMember()
      .then((member) => {
        if (active && member?.role === "ADMIN") router.replace("/admin/cars");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const member = await signIn(
        String(form.get("email")),
        String(form.get("password")),
        "admin",
      );
      if (member.role !== "ADMIN")
        throw new Error("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
      formElement.reset();
      setBusy(false);
      router.replace("/admin/cars");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ");
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-14 text-white lg:flex">
        <div className="absolute -right-40 top-1/4 h-[550px] w-[550px] rounded-full border border-blue-800/40 bg-blue-950/30" />
        <div className="absolute -right-20 top-1/3 h-[350px] w-[350px] rounded-full border border-blue-700/30" />
        <Link
          href="/"
          className="relative flex items-center gap-3 text-2xl font-bold"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            F
          </span>
          FUNCH{" "}
          <span className="rounded bg-blue-950 px-2 py-1 text-xs text-blue-400">
            ADMIN
          </span>
        </Link>
        <div className="relative">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-800 bg-blue-950 text-blue-400">
            <AdminIcon name="car" className="h-8 w-8" />
          </div>
          <p className="mb-4 text-xs tracking-[0.25em] text-blue-400">
            BACK-OFFICE MANAGEMENT
          </p>
          <h1 className="text-4xl leading-relaxed font-semibold">
            จัดการทุกการเดินทาง
            <br />
            จากที่เดียว
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
            ดูแลข้อมูลรถยนต์และความพร้อมให้บริการ
            <br />
            สำหรับเครือข่ายรถเช่า FUNCH ทั่วโลก
          </p>
        </div>
        <p className="relative text-xs text-slate-500">
          FUNCH Car Rental System · Admin Portal
        </p>
      </section>
      <section className="flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-12 block text-xl font-bold text-blue-600 lg:hidden"
          >
            FUNCH ADMIN
          </Link>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            สำหรับผู้ดูแลระบบเท่านั้น
          </span>
          <h2 className="mt-5 text-3xl font-bold text-slate-900">
            เข้าสู่ระบบหลังบ้าน
          </h2>
          <p className="mt-3 text-sm text-slate-500">
            กรอกอีเมลและรหัสผ่านบัญชีผู้ดูแลระบบ
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <fieldset disabled={busy} className="space-y-5">
              <label className="block text-sm font-medium">
                อีเมลผู้ดูแลระบบ
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  maxLength={254}
                  placeholder="admin@funch.example"
                  className="form-input mt-2 px-3 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                รหัสผ่าน
                <span className="relative mt-2 block">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    maxLength={128}
                    autoComplete="current-password"
                    className="form-input py-3 pr-16"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 text-xs text-slate-500"
                  >
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </span>
              </label>
            </fieldset>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error === "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
                  ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ"
                  : error}
              </p>
            )}
            <button disabled={busy} className="btn-primary w-full py-3 text-sm">
              {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ →"}
            </button>
          </form>
          <p className="mt-6 text-xs leading-6 text-slate-400">
            หากไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ
            <br />
            เพื่อขอสิทธิ์หรือความช่วยเหลือเกี่ยวกับบัญชี
          </p>
          <Link
            href="/"
            className="mt-10 inline-block text-xs text-slate-500 hover:text-blue-600"
          >
            ← กลับหน้าเว็บไซต์ลูกค้า
          </Link>
        </div>
      </section>
    </main>
  );
}
