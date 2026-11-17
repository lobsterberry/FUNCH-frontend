"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { Country } from "@/lib/rental";
import { carCategories, featureOptions, type AdminCar, type CarInput } from "@/lib/admin-cars";
import { Dialog } from "../rental-dialog";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-slate-600">{label}<span className="mt-1.5 block">{children}</span></label>;
}

export function CarForm({ car, countries, onClose, onSave }: { car: AdminCar | null; countries: Country[]; onClose: () => void; onSave: (data: CarInput) => Promise<void> }) {
  const [country, setCountry] = useState(car?.country || countries[0]?.code || "");
  const [location, setLocation] = useState(car?.locationId || "");
  const [steering, setSteering] = useState(car?.steering === "left" ? "LHD" : car ? "RHD" : countries[0]?.steering === "left" ? "LHD" : "RHD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedCountry = countries.find((item) => item.code === country);
  const extraFeatures = Object.fromEntries((car?.options || []).filter((item) => !(item.code in featureOptions)).map((item) => [item.code, item.label]));
  const features = { ...featureOptions, ...extraFeatures, ...Object.fromEntries((car?.featureCodes || []).filter((code) => !(code in featureOptions) && !(code in extraFeatures)).map((code) => [code, code])) };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categories = form.getAll("categories").map(String);
    if (!categories.length) { setError("กรุณาเลือกประเภทรถอย่างน้อย 1 ประเภท"); return; }
    const featureCodes = form.getAll("features").map(String);
    const text = (key: string) => String(form.get(key) || "").trim();
    setBusy(true); setError("");
    try {
      await onSave({ brand: text("brand"), model: text("model"), year: Number(form.get("year")), licensePlate: text("licensePlate"), country,
        hourlyRate: Number(form.get("hourlyRate")), dailyRate: Number(form.get("dailyRate")), seats: Number(form.get("seats")), luggageCapacity: Number(form.get("luggageCapacity")),
        transmission: text("transmission"), transmissionType: text("transmissionType") as CarInput["transmissionType"], fuelType: text("fuelType"), steeringSide: steering as CarInput["steeringSide"],
        locationId: location || null, categories, categoryLabel: text("categoryLabel"), providerName: text("providerName"), isAvailable: form.get("isAvailable") === "true",
        featureCodes, options: featureCodes.map((code) => ({ code, label: features[code as keyof typeof features] || code, included: car?.options?.find((option) => option.code === code)?.included ?? true })),
      });
    } catch (error) { setError(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ"); setBusy(false); }
  }
  return <Dialog wide title={car ? `แก้ไขรถยนต์ · ${car.name}` : "เพิ่มรถยนต์ใหม่"} onClose={() => { if (!busy) onClose(); }}><p className="mb-6 text-xs text-slate-500">ข้อมูลรถยนต์ ประเทศประจำการ และอัตราค่าเช่า · ช่องที่มี * จำเป็นต้องกรอก</p>
    <form onSubmit={submit} className="space-y-6"><fieldset disabled={busy} className="space-y-6">
      <section><h3 className="mb-3 text-sm font-semibold">1. ข้อมูลพื้นฐาน</h3><div className="grid gap-4 sm:grid-cols-3"><Field label="ยี่ห้อ *"><input className="form-input" name="brand" required maxLength={100} defaultValue={car?.brand} placeholder="Toyota" /></Field><Field label="รุ่น *"><input className="form-input" name="model" required maxLength={150} defaultValue={car?.rawModel} placeholder="Harrier Hybrid 2.5" /></Field><Field label="ปีผลิต *"><input className="form-input" name="year" type="number" min={1900} max={2100} required defaultValue={car?.year || 2026} /></Field><Field label="ทะเบียนรถ *"><input className="form-input" name="licensePlate" required maxLength={50} defaultValue={car?.licensePlate} /></Field><Field label="ผู้ให้บริการ"><input className="form-input" name="providerName" maxLength={150} defaultValue={car?.provider || "FUNCH Rental"} /></Field><Field label="สถานะให้บริการ *"><select className="form-input" name="isAvailable" defaultValue={String(car?.isAvailable ?? true)}><option value="true">พร้อมบริการ</option><option value="false">ซ่อมบำรุง / ปิดให้บริการ</option></select></Field></div></section>
      <section><h3 className="mb-3 text-sm font-semibold">2. ประเทศและจุดรับรถ</h3><div className="grid gap-4 sm:grid-cols-3"><Field label="ประเทศประจำการ *"><select className="form-input" required value={country} onChange={(event) => { const code = event.target.value; setCountry(code); setLocation(""); setSteering(countries.find((item) => item.code === code)?.steering === "left" ? "LHD" : "RHD"); }}>{countries.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.name}</option>)}</select></Field><Field label="จุดรับรถหลัก *"><select required className="form-input" value={location} onChange={(event) => setLocation(event.target.value)}><option value="">เลือกจุดรับรถ</option>{selectedCountry?.locations?.map((item) => <option key={item.id} value={item.id}>{item.cityTh} · {item.nameTh}</option>)}</select></Field><Field label="ตำแหน่งพวงมาลัย *"><select className="form-input" value={steering} onChange={(event) => setSteering(event.target.value)}><option value="RHD">ขวา (RHD)</option><option value="LHD">ซ้าย (LHD)</option></select></Field></div>{car?.rentalStatus !== "IDLE" && car && <p className="mt-2 text-xs text-amber-700">รถมีรายการจองอยู่ ไม่สามารถเปลี่ยนประเทศหรือจุดรับรถได้</p>}</section>
      <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"><h3 className="mb-3 text-sm font-semibold text-blue-900">3. อัตราค่าเช่า (THB)</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="รายชั่วโมง (บาท) *"><input className="form-input" name="hourlyRate" type="number" required min="0.01" max="9999999999.99" step="0.01" defaultValue={car?.hour} /></Field><Field label="รายวัน (บาท) *"><input className="form-input" name="dailyRate" type="number" required min="0.01" max="9999999999.99" step="0.01" defaultValue={car?.day} /></Field></div><p className="mt-3 text-[11px] text-blue-700">คำนวณตามกฎการเช่า 8 ชั่วโมง / 14:00 น. · รายการจองเดิมคงอัตราที่บันทึกไว้</p></section>
      <section><h3 className="mb-3 text-sm font-semibold">4. ประเภทและข้อมูลจำเพาะ</h3><div className="mb-4 flex flex-wrap gap-3">{carCategories.map((category) => <label key={category} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"><input type="checkbox" name="categories" value={category} defaultChecked={car?.categories.includes(category) ?? category === "SUV"} />{category}</label>)}</div><div className="grid gap-4 sm:grid-cols-3"><Field label="ชื่อประเภทที่แสดง *"><input className="form-input" name="categoryLabel" required maxLength={100} defaultValue={car?.category || "SUV"} /></Field><Field label="จำนวนที่นั่ง *"><input className="form-input" name="seats" type="number" min={1} max={60} required defaultValue={car?.seats || 5} /></Field><Field label="กระเป๋าเดินทาง (ใบ) *"><input className="form-input" name="luggageCapacity" type="number" min={0} max={60} required defaultValue={car?.bags ?? 2} /></Field><Field label="ประเภทเกียร์ *"><select className="form-input" name="transmissionType" defaultValue={car?.transmissionType || "AUTOMATIC"}><option value="AUTOMATIC">อัตโนมัติ</option><option value="MANUAL">ธรรมดา</option></select></Field><Field label="ชื่อระบบส่งกำลัง *"><input className="form-input" name="transmission" required maxLength={50} defaultValue={car?.gear || "Automatic"} /></Field><Field label="ประเภทพลังงาน *"><select className="form-input" name="fuelType" defaultValue={car?.fuel || "Gasoline"}><option value="Gasoline">เบนซิน</option><option value="Diesel">ดีเซล</option><option value="Hybrid">ไฮบริด</option><option value="EV">ไฟฟ้า (EV)</option></select></Field></div></section>
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="mb-3 text-xs font-semibold">ฟีเจอร์และอุปกรณ์</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(features).map(([code, label]) => <label key={code} className="flex items-center gap-2 text-xs"><input type="checkbox" name="features" value={code} defaultChecked={car?.featureCodes.includes(code)} />{label}</label>)}</div></section>
    </fieldset>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2 text-sm">ยกเลิก</button><button disabled={busy} className="btn-primary px-6 py-2 text-sm">{busy ? "กำลังบันทึก…" : "บันทึกข้อมูลรถยนต์"}</button></div></form>
  </Dialog>;
}
