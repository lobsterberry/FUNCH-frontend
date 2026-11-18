"use client";

import { useCallback, useEffect, useState } from "react";
import { adminRequest, type AdminCar } from "@/lib/admin-cars";
import type { LocationItem } from "@/lib/rental";
import { Dialog } from "@/components/shared/dialog";

type Rental = { id: string; bookingNumber: string; status: string; startDateTime: string; endDateTime: string;
  pickupLocation: LocationItem | null; dropoffLocation: LocationItem | null; turnaroundMinutes: number };
type Schedule = { bookings: Rental[]; location: LocationItem | null;
  movements: { id: string; occurredAt: string; fromLocation: LocationItem | null; toLocation: LocationItem; reason: string; note?: string | null }[] };
const labels: Record<string, string> = { PENDING: "รออนุมัติ", APPROVED: "อนุมัติแล้ว", REJECTED: "ปฏิเสธ", CANCELLED: "ยกเลิก", COMPLETED: "คืนรถแล้ว" };
const actions: Record<string, string[]> = { PENDING: ["APPROVED", "REJECTED", "CANCELLED"], APPROVED: ["COMPLETED", "CANCELLED"], CANCELLED: ["PENDING"], REJECTED: ["PENDING"], COMPLETED: [] };
function localTime(value: string, location: LocationItem | null) {
  return new Intl.DateTimeFormat("th-TH", { timeZone: location?.timeZone || "UTC", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function CarSchedule({ car, onClose, onChanged }: { car: AdminCar; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<Schedule | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => adminRequest<{ data: Schedule }>(`/api/fleet/cars/${encodeURIComponent(car.id)}/schedule`)
    .then((result) => { setData(result.data); setError(""); }).catch((cause: Error) => setError(cause.message)), [car.id]);
  useEffect(() => { void load(); }, [load]);
  async function change(rental: Rental, status: string) {
    setBusy(true); setError("");
    try {
      await adminRequest(`/api/bookings/${encodeURIComponent(rental.id)}/status`, "PATCH", { status });
      await load(); onChanged();
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <Dialog wide title={`ตารางรถ · ${car.licensePlate}`} onClose={() => { if (!busy) onClose(); }}>
    <div className="space-y-5" aria-busy={busy}>
      <p className="text-sm text-slate-600">ตำแหน่งปัจจุบัน: <strong>{data?.location?.nameTh || car.location?.nameTh || "ยังไม่ระบุ"}</strong></p>
      <p className="text-xs text-slate-500">วันเวลาแสดงตามสาขารับและคืนรถ การยืนยันคืนรถจะบันทึกตำแหน่งจริงและเริ่มเวลาเตรียมรถ</p>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}<button onClick={() => void load()} className="ml-2 underline">โหลดใหม่</button></p>}
      {!data && !error && <p role="status">กำลังโหลดตารางรถ…</p>}
      {data && <><div className="space-y-3">{data.bookings.map((rental) => <article key={rental.id} className="rounded-xl border border-slate-200 p-4 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><strong className="break-all">{rental.bookingNumber}</strong><span className="text-blue-700">{labels[rental.status]}</span></div>
        <p className="mt-2">รับ: {rental.pickupLocation?.nameTh || "—"} · {localTime(rental.startDateTime, rental.pickupLocation)}</p>
        <p>คืน: {rental.dropoffLocation?.nameTh || "—"} · {localTime(rental.endDateTime, rental.dropoffLocation)}</p>
        <p className="mt-1 text-xs text-slate-500">เตรียมรถหลังคืน {rental.turnaroundMinutes} นาที</p>
        <div className="mt-3 flex flex-wrap gap-2">{actions[rental.status]?.map((status) => <button disabled={busy} key={status} onClick={() => void change(rental, status)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-700">{status === "COMPLETED" ? "ยืนยันรับรถคืนแล้ว" : status === "APPROVED" ? "อนุมัติ" : status === "PENDING" ? "เปิดคำขออีกครั้ง" : labels[status]}</button>)}</div>
      </article>)}</div>
      {!data.bookings.length && <p className="text-sm text-slate-500">ยังไม่มีรายการจอง</p>}
      <section className="border-t border-slate-200 pt-4"><h3 className="mb-3 text-sm font-semibold">ประวัติการย้ายรถ</h3>{data.movements.map((movement) => <div key={movement.id} className="mb-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p>{localTime(movement.occurredAt, movement.toLocation)} · {movement.fromLocation?.nameTh || "—"} → {movement.toLocation.nameTh} · {movement.reason === "RENTAL_RETURN" ? "รับรถคืน" : "แอดมินย้ายรถ"}</p>{movement.note && <p className="mt-1 text-slate-500">เหตุผล: {movement.note}</p>}</div>)}{!data.movements.length && <p className="text-xs text-slate-500">ยังไม่มีการย้ายรถ</p>}</section></>}
    </div>
  </Dialog>;
}
