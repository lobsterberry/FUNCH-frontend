"use client";

import type { Country } from "@/lib/rental";
import { money } from "@/lib/rental";
import type { FleetOffer, FleetUnit } from "@/lib/fleet";
import { AdminIcon } from "../layout/admin-icon";

export function FleetLocationView({ countries, locationIds, offers, units, onManage, onOffer }: {
  countries: Country[]; locationIds: Set<string>; offers: FleetOffer[]; units: FleetUnit[];
  onManage: (locationId: string, modelId?: string) => void; onOffer: (locationId: string) => void;
}) {
  return <div className="grid items-start gap-5 xl:grid-cols-2 2xl:grid-cols-3">{countries.flatMap((country) => (country.locations || []).filter((location) => locationIds.has(location.id)).map((location) => {
    const stock = units.filter((unit) => unit.locationId === location.id);
    const branchOffers = offers.filter((offer) => offer.locationId === location.id);
    const models = [...new Map([...branchOffers.map((offer) => [offer.carModelId, `${offer.carModel.brand} ${offer.carModel.model}`] as const),
      ...stock.filter((unit) => unit.carModelId).map((unit) => [unit.carModelId!, unit.name] as const)]).entries()];
    return <article key={location.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><div className="flex items-start gap-3"><span className="text-2xl">{country.flag}</span><div><h3 className="text-sm font-semibold text-slate-900">{location.nameTh || location.name}</h3><p className="mt-1 text-[10px] text-slate-400">{country.name} · {location.timeZone}</p></div></div><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center"><div><p className="text-[10px] text-slate-400">รุ่นรถ</p><p className="mt-1 text-base font-semibold text-indigo-600">{models.length}</p></div><div><p className="text-[10px] text-slate-400">รถทั้งหมด</p><p className="mt-1 text-base font-semibold">{stock.length}</p></div><div><p className="text-[10px] text-slate-400">พร้อมบริการ</p><p className="mt-1 text-base font-semibold text-emerald-600">{stock.filter((unit) => unit.fleetStatus === "AVAILABLE").length}</p></div></div></div>
      <div className="divide-y divide-slate-100 px-5">{models.map(([modelId, name]) => <div key={modelId} className="py-4"><div className="flex items-start justify-between gap-3"><button onClick={() => onManage(location.id, modelId)} className="text-left text-xs font-medium text-slate-800 hover:text-blue-600">{name}</button><span className="shrink-0 text-[10px] text-slate-500">{stock.filter((unit) => unit.carModelId === modelId).length} คัน</span></div>{branchOffers.filter((offer) => offer.carModelId === modelId).map((offer) => <p key={offer.id} className="mt-1.5 text-[10px] leading-5 text-slate-400">{offer.providerName} · <span className="text-blue-600">{money(Number(offer.dailyRate))}/วัน</span> · {money(Number(offer.hourlyRate))}/ชม. {offer.isActive ? "" : "· ปิดรับจอง"}</p>)}</div>)}{!models.length && <p className="py-6 text-center text-xs text-slate-400">ยังไม่มีรุ่นรถในสาขานี้</p>}</div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px]"><button onClick={() => onOffer(location.id)} className="text-emerald-700 hover:underline">+ ตั้งค่าราคาเช่ารถ</button><button onClick={() => onManage(location.id)} className="flex items-center gap-1 font-medium text-blue-600 hover:underline">จัดการรุ่นรถ <AdminIcon name="models" className="h-3.5 w-3.5" /></button></div>
    </article>;
  }))}</div>;
}
