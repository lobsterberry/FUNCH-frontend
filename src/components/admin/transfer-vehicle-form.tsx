"use client";

import { useState, type FormEvent } from "react";
import type { FleetOffer, FleetUnit, InventoryInput } from "@/lib/fleet";
import { transferOffers } from "@/lib/fleet-view";
import { Dialog } from "../rental-dialog";
import { AutocompleteSelect } from "../autocomplete-select";

export function TransferVehicleForm({ units, offers, initialUnitId, onClose, onSave }: {
  units: FleetUnit[]; offers: FleetOffer[]; initialUnitId?: string; onClose: () => void;
  onSave: (unit: FleetUnit, input: InventoryInput) => Promise<void>;
}) {
  const [unitId, setUnitId] = useState(initialUnitId || "");
  const [destinationId, setDestinationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unit = units.find((item) => item.id === unitId);
  const destinations = unit ? transferOffers(unit, offers) : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!unit) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try { await onSave(unit, { carModelLocationId: String(form.get("destination")), licensePlate: unit.licensePlate!, year: unit.year,
      isAvailable: unit.isAvailable!, operationalStatus: unit.operationalStatus, transfer: true, transferNote: String(form.get("note") || "").trim() }); }
    catch (cause) { setError((cause as Error).message); setBusy(false); }
  }
  return <Dialog title="ย้ายรถข้ามสาขา" onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-4">
      <p className="text-xs text-slate-500">ย้ายไปยังสาขาที่เปิดบริการรุ่นและผู้ให้บริการเดียวกันภายในประเทศ</p>
      <label className="block text-xs font-medium">คันรถที่ต้องการย้าย *<select required value={unitId} onChange={(event) => { setUnitId(event.target.value); setDestinationId(""); setError(""); }} className="form-input mt-1"><option value="">เลือกทะเบียนรถ</option>{units.map((item) => <option key={item.id} value={item.id}>{item.licensePlate} · {item.name}</option>)}</select></label>
      <label className="block text-xs font-medium">สาขาต้นทาง<input readOnly value={unit?.location?.nameTh || "—"} className="form-input mt-1 bg-slate-50" /></label>
      <AutocompleteSelect key={unitId} label="สาขาปลายทาง *" name="destination" required disabled={busy || !unit}
        value={destinationId} onChange={setDestinationId} placeholder="พิมพ์ค้นหาสาขาปลายทาง…"
        options={destinations.map((offer) => ({ value: offer.id, label: `${offer.location.nameTh} · ${offer.providerName}`,
          description: offer.location.cityTh, keywords: `${offer.location.name} ${offer.location.city} ${offer.location.airportCode || ""}` }))} />
      {unit?.hasBookings && <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">รถมีรายการจองค้าง กรุณาจัดการตารางรถก่อนย้ายสาขา</p>}
      {unit && !destinations.length && <p className="text-xs text-amber-700">ยังไม่มีสาขาปลายทางที่รองรับ กรุณาเปิดรุ่นรถและผู้ให้บริการในสาขาปลายทางก่อน</p>}
      <label className="block text-xs font-medium">เหตุผลการโอนย้าย<textarea name="note" rows={3} maxLength={1000} placeholder="เช่น ปรับจำนวนรถรองรับการจองในสาขาปลายทาง" className="form-input mt-1" /></label>
    </fieldset>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border px-4 py-2 text-xs">ยกเลิก</button><button disabled={busy || !unit || unit.hasBookings || !destinations.length} className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700">{busy ? "กำลังย้าย…" : "ยืนยันการโอนย้าย"}</button></div>
    </form>
  </Dialog>;
}
