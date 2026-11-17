"use client";

import { useState, type FormEvent } from "react";
import type { FleetCatalogData, FleetUnit, InventoryMutation, VehicleStatus } from "@/lib/fleet";
import { fleetStatusLabels } from "@/lib/fleet-view";
import { money } from "@/lib/rental";
import { Dialog } from "../rental-dialog";
import { AutocompleteSelect } from "../autocomplete-select";

export function CarForm({ car, catalog, initialOfferId, initialModelId, initialLocationId, onClose, onSave }: {
  car: FleetUnit | null; catalog: FleetCatalogData; initialOfferId?: string; initialModelId?: string; initialLocationId?: string;
  onClose: () => void; onSave: (data: InventoryMutation) => Promise<void>;
}) {
  const initial = catalog.offers.find((offer) => offer.id === (car?.carModelLocationId || initialOfferId));
  const [modelId, setModelId] = useState(initial?.carModelId || initialModelId || "");
  const [locationId, setLocationId] = useState(initial?.locationId || initialLocationId || "");
  const [offerId, setOfferId] = useState(initial?.id || "");
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const modelOffers = catalog.offers.filter((offer) => offer.carModelId === modelId);
  const branches = [...new Map(modelOffers.map((offer) => [offer.locationId, offer.location])).values()];
  const providers = modelOffers.filter((offer) => offer.locationId === locationId);
  const offer = providers.find((item) => item.id === offerId) || (providers.length === 1 ? providers[0] : undefined);
  const locked = Boolean(car?.carModelLocationId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offer) { setError("เลือกรุ่น สาขา และผู้ให้บริการให้ครบ"); return; }
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || "").trim();
    const status = text("operationalStatus") as VehicleStatus;
    const common = { carModelLocationId: offer.id, year: offer.carModel.year, operationalStatus: status,
      isAvailable: status === "AVAILABLE", exteriorColor: text("exteriorColor") || null,
      odometerKm: text("odometerKm") === "" ? null : Number(text("odometerKm")) };
    const plates = text("licensePlates").split(/\r?\n/).map((plate) => plate.trim()).filter(Boolean);
    if (bulk && (!plates.length || plates.length > 100 || plates.some((plate) => plate.length > 50) || new Set(plates).size !== plates.length)) {
      setError("กรอกทะเบียนไม่ซ้ำ 1–100 คัน บรรทัดละคัน ความยาวไม่เกิน 50 ตัวอักษร"); return;
    }
    setBusy(true); setError("");
    try { await onSave(bulk ? { ...common, licensePlates: plates } : { ...common, licensePlate: text("licensePlate"), vin: text("vin") || null }); }
    catch (cause) { setError((cause as Error).message); setBusy(false); }
  }
  return <Dialog wide title={car ? `แก้ไขคันรถ · ${car.licensePlate}` : "เพิ่มคันรถจริง (ทะเบียน)"} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-5">
      <p className="text-xs text-slate-500">เลือกรุ่นและบริการรายสาขาเพื่อใช้สเปกและอัตราค่าเช่าร่วมกัน รถแต่ละคันมีทะเบียนและตารางจองของตนเอง</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <AutocompleteSelect label="รุ่นรถ *" required disabled={busy || locked} value={modelId}
          placeholder="พิมพ์ค้นหายี่ห้อหรือรุ่นรถ…"
          options={catalog.models.map((model) => ({ value: model.id, label: `${model.brand} ${model.model} · ${model.year} · ${model.steeringSide}` }))}
          onChange={(value) => { setModelId(value); setLocationId(""); setOfferId(""); }} />
        <AutocompleteSelect key={modelId} label="สาขาที่สังกัด *" required disabled={busy || locked || !modelId} value={locationId}
          placeholder="พิมพ์ค้นหาสาขาหรือสนามบิน…"
          options={branches.map((branch) => ({ value: branch.id, label: branch.nameTh || branch.name,
            description: `${branch.cityTh} · ${branch.countryCode}`, keywords: `${branch.name} ${branch.city} ${branch.airportCode || ""}` }))}
          onChange={(value) => { setLocationId(value); setOfferId(""); }} />
        <label className="text-xs font-medium sm:col-span-2">ผู้ให้บริการ *<select required disabled={locked || !locationId} value={offer?.id || ""} onChange={(event) => setOfferId(event.target.value)} className="form-input mt-1"><option value="">เลือกผู้ให้บริการ</option>{providers.map((item) => <option key={item.id} value={item.id}>{item.providerName}{item.isActive ? "" : " (ปิดรับจอง)"} · {money(Number(item.dailyRate))}/วัน</option>)}</select></label>
      </div>
      {offer && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">{offer.carModel.seats} ที่นั่ง · {offer.carModel.transmission} · {offer.carModel.fuelType} · {money(Number(offer.hourlyRate))}/ชม. · <strong>{money(Number(offer.dailyRate))}/วัน</strong></div>}
      {!car && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={bulk} onChange={(event) => setBulk(event.target.checked)} />เพิ่มหลายทะเบียนในครั้งเดียว (สูงสุด 100 คัน)</label>}
      <div className="grid gap-4 sm:grid-cols-2">
        {bulk ? <label className="text-xs font-medium sm:col-span-2">ทะเบียนรถ บรรทัดละคัน *<textarea required name="licensePlates" rows={4} maxLength={5100} placeholder={"กก 1234\nกก 5678"} className="form-input mt-1 font-mono" /><span className="mt-1 block text-[11px] text-slate-400">ถ้ามีทะเบียนซ้ำจะไม่บันทึกทั้งชุด สี เลขไมล์ และสถานะด้านล่างใช้กับทุกคันในชุด</span></label>
          : <><label className="text-xs font-medium">เลขทะเบียนรถ *<input required name="licensePlate" maxLength={50} defaultValue={car?.licensePlate} className="form-input mt-1 font-mono" /></label><label className="text-xs font-medium">เลขตัวถัง (VIN / Chassis)<input name="vin" maxLength={50} defaultValue={car?.vin || ""} className="form-input mt-1 font-mono" /></label></>}
        <label className="text-xs font-medium">สีตัวรถ<input name="exteriorColor" maxLength={100} defaultValue={car?.exteriorColor || ""} placeholder="เช่น ขาวมุก" className="form-input mt-1" /></label>
        <label className="text-xs font-medium">เลขไมล์ (km)<input name="odometerKm" type="number" min={0} max={2147483647} step={1} defaultValue={car?.odometerKm ?? ""} className="form-input mt-1" /></label>
        <label className="text-xs font-medium sm:col-span-2">สถานะการปฏิบัติงาน<select name="operationalStatus" defaultValue={car?.operationalStatus || "AVAILABLE"} className="form-input mt-1">{(["AVAILABLE", "CLEANING", "MAINTENANCE", "INACTIVE"] as const).map((status) => <option key={status} value={status}>{fleetStatusLabels[status]}</option>)}</select></label>
      </div>
      {car && <p className="text-xs leading-6 text-slate-500">ตำแหน่งปัจจุบัน: {car.location?.nameTh || "ยังไม่ระบุ"} · ใช้คำสั่ง “ย้ายสาขา” เมื่อต้องการโอนรถ รถที่มีรายการจองต้องจัดการตารางก่อนปิดบริการหรือส่งซ่อม</p>}
      {!modelOffers.length && <p className="text-xs text-amber-700">เปิดรุ่นรถในสาขาก่อนเพิ่มทะเบียน</p>}
    </fieldset>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-xs">ยกเลิก</button><button disabled={busy || !offer} className="btn-primary px-5 py-2 text-xs">{busy ? "กำลังบันทึก…" : car ? "บันทึกการแก้ไข" : "บันทึกรถเข้าฝูง"}</button></div>
    </form>
  </Dialog>;
}
