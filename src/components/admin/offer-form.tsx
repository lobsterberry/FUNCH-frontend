"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import type { Country } from "@/lib/rental";
import type { FleetModel, FleetOffer } from "@/lib/fleet";
import { Dialog } from "../rental-dialog";
import { AutocompleteSelect } from "../autocomplete-select";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-slate-700">{label}<span className="mt-1 block">{children}</span></label>;
}

export function OfferForm({ offer, models, countries, initialModelId, initialLocationId, onClose, onSave }: { offer: FleetOffer | null; models: FleetModel[]; countries: Country[]; initialModelId?: string; initialLocationId?: string; onClose: () => void; onSave: (body: unknown) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modelId, setModelId] = useState(offer?.carModelId || initialModelId || "");
  const [locationId, setLocationId] = useState(offer?.locationId || initialLocationId || "");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await onSave({ carModelId: offer?.carModelId || String(form.get("carModelId")), locationId: offer?.locationId || String(form.get("locationId")),
        providerName: offer?.providerName || String(form.get("providerName")).trim(),
        hourlyRate: Number(form.get("hourlyRate")), dailyRate: Number(form.get("dailyRate")),
        turnaroundMinutes: Number(form.get("turnaroundMinutes")), isActive: form.get("isActive") === "true" });
    } catch (cause) { setError((cause as Error).message); setBusy(false); }
  }
  return <Dialog title={offer ? "แก้ไขบริการรายสาขา" : "เปิดรุ่นรถในสาขา"} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="space-y-5"><fieldset disabled={busy} className="space-y-4">
      <AutocompleteSelect label="รุ่นรถ *" name="carModelId" required disabled={busy || Boolean(offer)} value={modelId} onChange={setModelId}
        placeholder="พิมพ์ค้นหายี่ห้อหรือรุ่นรถ…"
        options={models.map((model) => ({ value: model.id, label: `${model.brand} ${model.model} · ${model.year} · ${model.steeringSide}` }))} />
      <AutocompleteSelect label="สาขา *" name="locationId" required disabled={busy || Boolean(offer)} value={locationId} onChange={setLocationId}
        placeholder="พิมพ์ค้นหาสาขา เมือง หรือสนามบิน…"
        options={countries.flatMap((country) => (country.locations || []).map((location) => ({ value: location.id,
          label: location.nameTh || location.name, description: `${country.flag} ${country.name} · ${location.cityTh}`,
          keywords: `${country.code} ${location.name} ${location.city} ${location.airportCode || ""}` })))} />
      <Field label="ผู้ให้บริการ *"><input required disabled={Boolean(offer)} name="providerName" maxLength={150} defaultValue={offer?.providerName || "FUNCH Rental"} className="form-input" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="รายชั่วโมง (THB) *"><input required name="hourlyRate" type="number" min="0.01" max="9999999999.99" step="0.01" defaultValue={offer?.hourlyRate} className="form-input" /></Field><Field label="รายวัน (THB) *"><input required name="dailyRate" type="number" min="0.01" max="9999999999.99" step="0.01" defaultValue={offer?.dailyRate} className="form-input" /></Field></div>
      <Field label="เวลาเตรียมรถหลังคืน (นาที) *"><input required name="turnaroundMinutes" type="number" min={0} max={1440} defaultValue={offer?.turnaroundMinutes ?? 60} className="form-input" /></Field>
      <Field label="สถานะ"><select name="isActive" defaultValue={String(offer?.isActive ?? true)} className="form-input"><option value="true">เปิดรับจอง</option><option value="false">ปิดรับจอง</option></select></Field>
      <p className="text-xs text-slate-500">รายการจองเดิมคงราคาและเวลาเตรียมรถที่บันทึกไว้ การเปลี่ยนรุ่น สาขา หรือผู้ให้บริการให้สร้างบริการใหม่</p>
    </fieldset>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">ยกเลิก</button><button disabled={busy} className="btn-primary px-4 py-2 text-sm">{busy ? "กำลังบันทึก…" : "บันทึกบริการรายสาขา"}</button></div>
    </form>
  </Dialog>;
}

