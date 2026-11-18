"use client";

import type { KeyboardEvent } from "react";
import type { Country } from "@/lib/rental";
import { carCategories } from "@/lib/admin-cars";
import { fleetStatusLabels, type FleetFilters as Filters } from "@/lib/fleet-view";
import { AdminIcon } from "../layout/admin-icon";
import { AutocompleteSelect } from "../autocomplete-select";

export type FleetView = "model" | "location" | "fleet";
export function FleetFilters({ filters, countries, view, counts, onChange, onView }: {
  filters: Filters; countries: Country[]; view: FleetView; counts: Record<FleetView, number>;
  onChange: (change: Partial<Filters>) => void; onView: (view: FleetView) => void;
}) {
  const tabs = [{ id: "model", label: "ตามรุ่นรถ", icon: "models" }, { id: "location", label: "ตามสาขา", icon: "location" }, { id: "fleet", label: "ทะเบียนรถทั้งหมด", icon: "menu" }] as const;
  function keydown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
    if (next === null) return;
    event.preventDefault(); onView(tabs[next].id); document.getElementById(`fleet-tab-${tabs[next].id}`)?.focus();
  }
  return <section aria-label="มุมมองและตัวกรองรถยนต์" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <div role="tablist" aria-label="มุมมองฝูงรถ" className="inline-flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">{tabs.map((tab, index) => <button key={tab.id} id={`fleet-tab-${tab.id}`} role="tab" aria-selected={view === tab.id} aria-controls={`fleet-panel-${tab.id}`} tabIndex={view === tab.id ? 0 : -1} onKeyDown={(event) => keydown(event, index)} onClick={() => onView(tab.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 transition ${view === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}><AdminIcon name={tab.icon} className="h-4 w-4" />{tab.label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${view === tab.id ? "bg-blue-50 text-blue-700" : "bg-slate-200 text-slate-500"}`}>{counts[tab.id]}</span></button>)}</div>
      <label className="relative w-full xl:max-w-80"><span className="sr-only">ค้นหารุ่นรถ ทะเบียน หรือสาขา</span><AdminIcon name="search" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" /><input type="search" value={filters.search} onChange={(event) => onChange({ search: event.target.value })} placeholder="ค้นหารุ่นรถ, ทะเบียน, สาขา หรือยี่ห้อ…" className="form-input pl-9" /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-[11px] font-medium text-slate-500">ประเทศ (Country)<select value={filters.country} onChange={(event) => onChange({ country: event.target.value, location: "all" })} className="form-input mt-1"><option value="all">ทุกประเทศ</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.name}</option>)}</select></label>
      <AutocompleteSelect key={filters.country} label="สาขา / จุดรับรถ (Branch)" labelClassName="text-[11px] font-medium text-slate-500"
        value={filters.location} onChange={(value) => onChange({ location: value || "all" })} placeholder="พิมพ์ค้นหาสาขาหรือสนามบิน…"
        options={[{ value: "all", label: "ทุกสาขา" }, ...countries.filter((country) => filters.country === "all" || country.code === filters.country)
          .flatMap((country) => (country.locations || []).map((location) => ({ value: location.id, label: location.nameTh || location.name,
            description: `${country.flag} ${country.name} · ${location.cityTh}`, keywords: `${country.code} ${location.name} ${location.city} ${location.airportCode || ""}` })))]} />
      <label className="text-[11px] font-medium text-slate-500">ประเภทรถ (Category)<select value={filters.category} onChange={(event) => onChange({ category: event.target.value })} className="form-input mt-1"><option value="all">ทุกประเภท</option>{carCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="text-[11px] font-medium text-slate-500">สถานะคันรถ (Status)<select value={filters.status} onChange={(event) => onChange({ status: event.target.value })} className="form-input mt-1"><option value="all">ทุกสถานะ</option>{Object.entries(fleetStatusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    {Object.values(filters).some((value) => value !== "all" && value !== "") && <div className="flex items-center justify-between text-xs"><p className="text-slate-500">กำลังแสดงผลตามตัวกรอง{filters.model !== "all" ? "และรุ่นรถที่เลือก" : ""}</p><button onClick={() => onChange({ search: "", country: "all", location: "all", category: "all", status: "all", model: "all" })} className="text-blue-600 hover:underline">ล้างตัวกรอง</button></div>}
  </section>;
}
