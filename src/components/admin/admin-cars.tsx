"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Country } from "@/lib/rental";
import { money } from "@/lib/rental";
import { ApiError } from "@/lib/account";
import { adminRequest, carCategories, carsCsv, defaultCarFilters, filterAdminCars, type AdminCar, type CarFilters, type CarInput } from "@/lib/admin-cars";
import { CarForm } from "./car-form";
import { AdminIcon } from "../layout/admin-icon";

const pageSize = 10;

export function AdminCars() {
  const router = useRouter();
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState<CarFilters>(defaultCarFilters);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminCar | "new" | null>(null);

  const load = useCallback(() => {
    return Promise.all([
        adminRequest<{ data: AdminCar[] }>("/api/admin/cars"),
        adminRequest<{ data: Country[] }>("/api/countries"),
      ]).then(([fleet, countryList]) => {
      setCars(fleet.data); setCountries(countryList.data); setError("");
    }).catch((error: unknown) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) { router.replace("/admin/login"); router.refresh(); }
      setError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
    }).finally(() => setLoading(false));
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  function refresh() { setLoading(true); setError(""); void load(); }

  function changeFilter<K extends keyof CarFilters>(key: K, value: CarFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value })); setPage(1);
  }
  async function save(data: CarInput) {
    try {
      await adminRequest(editing === "new" ? "/api/cars" : `/api/cars/${encodeURIComponent((editing as AdminCar).id)}`, editing === "new" ? "POST" : "PATCH", data);
      setEditing(null); setNotice("บันทึกข้อมูลรถยนต์เรียบร้อยแล้ว"); setLoading(true); await load();
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) { router.replace("/admin/login"); router.refresh(); }
      throw error;
    }
  }
  const filtered = filterAdminCars(cars, filters);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const ready = cars.filter((car) => car.isAvailable && car.rentalStatus === "IDLE").length;
  const booked = cars.filter((car) => car.rentalStatus !== "IDLE").length;
  const maintenance = cars.filter((car) => !car.isAvailable).length;
  const categoryBase = filterAdminCars(cars, { ...filters, category: "all" });
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([carsCsv(filtered)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "funch-cars.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-[11px] font-medium tracking-widest text-blue-600">FLEET MANAGEMENT</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">จัดการข้อมูลรถยนต์</h1><p className="mt-1.5 text-xs text-slate-500">จัดการฝูงรถ อัตราค่าเช่า และความพร้อมให้บริการทั่วโลก</p></div><div className="flex gap-2"><button disabled={loading || !!error || !filtered.length} onClick={exportCsv} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50">↓ ส่งออก CSV</button><button disabled={loading || !!error || !countries.length} onClick={() => setEditing("new")} className="btn-primary px-4 py-2.5 text-xs shadow-sm">＋ เพิ่มรถยนต์ใหม่</button></div></div>
    {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}<button onClick={() => setNotice("")} aria-label="ปิดข้อความสำเร็จ" className="px-2">×</button></div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
      { label: "รถทั้งหมดในระบบ", value: cars.length, detail: `ครอบคลุม ${new Set(cars.map((car) => car.country)).size} ประเทศ`, color: "text-blue-600", bg: "bg-blue-50", icon: "car" as const },
      { label: "พร้อมให้บริการ", value: ready, detail: "เปิดให้บริการและไม่มีรายการจอง", color: "text-emerald-600", bg: "bg-emerald-50", icon: "car" as const },
      { label: "กำลังเช่า / จองอยู่", value: booked, detail: "รายการจองที่รออนุมัติหรืออนุมัติแล้ว", color: "text-blue-600", bg: "bg-blue-50", icon: "booking" as const },
      { label: "ซ่อมบำรุง / ปิดบริการ", value: maintenance, detail: "พักการรับจองรถชั่วคราว", color: "text-amber-600", bg: "bg-amber-50", icon: "car" as const },
    ].map((stat) => <div key={stat.label} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div><p className="text-[11px] text-slate-500">{stat.label}</p><p className={`mt-2 text-3xl font-bold ${stat.color}`}>{loading || error ? "—" : stat.value}<span className="ml-2 text-xs font-normal text-slate-400">คัน</span></p><p className="mt-2 text-[10px] text-slate-400">{stat.detail}</p></div><span className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex ${stat.bg} ${stat.color}`}><AdminIcon name={stat.icon} /></span></div>)}</div>
    <section aria-label="ตัวกรองรถยนต์" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]"><input aria-label="ค้นหารถยนต์" placeholder="ค้นหายี่ห้อ รุ่น ทะเบียน หรือผู้ให้บริการ…" value={filters.search} onChange={(event) => changeFilter("search", event.target.value)} className="form-input py-2.5" /><select aria-label="กรองประเทศ" className="form-input" value={filters.country} onChange={(event) => changeFilter("country", event.target.value)}><option value="all">ทุกประเทศ</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name}</option>)}</select><select aria-label="กรองสถานะ" className="form-input" value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}><option value="all">สถานะทั้งหมด</option><option value="available">พร้อมให้บริการ</option><option value="booked">กำลังเช่า / จองอยู่</option><option value="maintenance">ซ่อมบำรุง / ปิดบริการ</option></select><select aria-label="กรองพวงมาลัย" className="form-input" value={filters.steering} onChange={(event) => changeFilter("steering", event.target.value)}><option value="all">พวงมาลัยทั้งหมด</option><option value="right">พวงมาลัยขวา (RHD)</option><option value="left">พวงมาลัยซ้าย (LHD)</option></select></div>
      <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[11px] text-slate-400">ประเภท:</span>{["all", ...carCategories].map((category) => <button key={category} aria-pressed={filters.category === category} onClick={() => changeFilter("category", category)} className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${filters.category === category ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{category === "all" ? "ทั้งหมด" : category} ({category === "all" ? categoryBase.length : categoryBase.filter((car) => car.categories.includes(category as typeof carCategories[number])).length})</button>)}<button onClick={() => { setFilters(defaultCarFilters); setPage(1); }} className="ml-auto px-2 py-1 text-[11px] text-blue-600 hover:underline">ล้างตัวกรอง</button></div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><h2 className="text-sm font-semibold text-slate-900">รายการรถยนต์ในระบบ</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-500">{filtered.length} คัน</span></div><button onClick={refresh} disabled={loading} className="text-xs text-blue-600 hover:underline">↻ โหลดข้อมูลใหม่</button></div>
      {loading ? <p role="status" className="p-12 text-center text-sm text-slate-500">กำลังโหลดข้อมูลรถยนต์…</p> : error ? <div role="alert" className="p-10 text-center"><p className="text-sm text-red-600">{error}</p><button onClick={refresh} className="btn-primary mt-4 px-4 py-2 text-xs">ลองอีกครั้ง</button></div> : <>
        <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500"><tr>{["ข้อมูลรถยนต์ / ยี่ห้อและรุ่น", "ประเทศและจุดรับรถ", "ประเภท / สเปก", "พวงมาลัย", "รายชั่วโมง", "รายวัน", "สถานะ", "จัดการ"].map((label) => <th key={label} scope="col" className="px-4 py-3.5 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((car) => { const country = countries.find((item) => item.code === car.country); return <tr key={car.id} className={`${car.isAvailable ? "hover:bg-slate-50/70" : "bg-amber-50/30 hover:bg-amber-50/60"}`}><td className="px-4 py-4"><div className="flex items-center gap-3"><span className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border ${car.fuel === "EV" ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-blue-100 bg-blue-50 text-blue-600"}`}><AdminIcon name="car" className="h-6 w-6" /></span><div><p className="min-w-40 font-semibold text-slate-900">{car.name}</p><p className="mt-1 text-[10px] text-slate-400">ปี {car.year} <span className="mx-1">·</span><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">{car.licensePlate}</span></p><p className="mt-1 text-[10px] text-slate-400">{car.provider}</p></div></div></td><td className="px-4 py-4"><p className="font-medium">{country?.flag} {country?.name || car.country}</p><p className="mt-1 max-w-40 text-[10px] leading-5 text-slate-500">{car.city} · {car.location?.nameTh || "ยังไม่ระบุจุดรับรถ"}</p></td><td className="px-4 py-4"><span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{car.category}</span><p className="mt-2 text-[10px] text-slate-400">{car.seats} ที่นั่ง · {car.fuel}</p><p className="mt-0.5 text-[10px] text-slate-400">{car.gear}</p></td><td className="whitespace-nowrap px-4 py-4"><span className={`rounded px-2 py-1 text-[10px] font-medium ${car.steering === "right" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{car.steering === "right" ? "ขวา (RHD)" : "ซ้าย (LHD)"}</span></td><td className="whitespace-nowrap px-4 py-4 font-medium text-slate-700">{money(car.hour)}</td><td className="whitespace-nowrap px-4 py-4 font-bold text-blue-600">{money(car.day)}</td><td className="whitespace-nowrap px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${!car.isAvailable ? "bg-amber-100 text-amber-800" : car.rentalStatus !== "IDLE" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>{!car.isAvailable ? "● ซ่อมบำรุง" : car.rentalStatus === "IN_USE" ? "● กำลังใช้งาน" : car.rentalStatus === "RESERVED" ? "● จองอยู่" : "● พร้อมบริการ"}</span>{!car.isAvailable && car.rentalStatus !== "IDLE" && <p className="mt-1 text-[10px] text-blue-600">มีรายการจอง</p>}</td><td className="px-4 py-4"><button onClick={() => setEditing(car)} aria-label={`แก้ไข ${car.name}`} className="rounded-lg border border-blue-100 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50">แก้ไข</button></td></tr>; })}</tbody></table></div>
        {!filtered.length && <div className="p-12 text-center"><p className="font-medium text-slate-700">{cars.length ? "ไม่พบรถยนต์ที่ตรงกับตัวกรอง" : "ยังไม่มีรถยนต์ในระบบ"}</p><p className="mt-2 text-xs text-slate-400">{cars.length ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง" : "เริ่มต้นด้วยการเพิ่มรถยนต์ใหม่"}</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-[11px] text-slate-500"><p>แสดง {filtered.length ? (currentPage - 1) * pageSize + 1 : 0} – {Math.min(currentPage * pageSize, filtered.length)} จาก {filtered.length} รายการ</p><nav aria-label="แบ่งหน้ารายการรถยนต์" className="flex items-center gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">ย้อนกลับ</button><span className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white" aria-current="page">{currentPage} / {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">ถัดไป</button></nav></div>
      </>}
    </section>
    <p className="text-[10px] leading-5 text-slate-400">อัตราค่าเช่าแสดงเป็น THB · รถที่มีรายการจองและปิดบริการอาจนับรวมอยู่ทั้งสองกลุ่ม · สถานะอัปเดตเมื่อโหลดข้อมูลใหม่</p>
    {editing && <CarForm car={editing === "new" ? null : editing} countries={countries} onClose={() => setEditing(null)} onSave={save} />}
  </div>;
}
