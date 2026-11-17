import type { FleetSummary } from "@/lib/fleet";
import { AdminIcon } from "../layout/admin-icon";

export function FleetOverview({ summary, loading }: { summary?: FleetSummary; loading: boolean }) {
  const stats = [
    { title: "โมเดลรถทั้งหมด", value: summary?.models, unit: "รุ่น", detail: "สเปกกลางของรถแต่ละรุ่น", color: "text-slate-900", background: "bg-blue-50 text-blue-600", icon: "models" as const },
    { title: "สาขาที่เปิดให้บริการ", value: summary?.locations, unit: "สาขา", detail: `ครอบคลุม ${summary?.countries ?? "—"} ประเทศ`, color: "text-indigo-700", background: "bg-indigo-50 text-indigo-600", icon: "location" as const },
    { title: "รถจริงในฝูงทั้งหมด", value: summary?.total, unit: "คัน", detail: "ทุกทะเบียนในระบบ", color: "text-slate-900", background: "bg-slate-100 text-slate-600", icon: "car" as const },
    { title: "พร้อมให้บริการ", value: summary?.available, unit: "คัน", detail: "พร้อมรับการจองและพ้นเวลาเตรียมรถ", color: "text-emerald-600", background: "bg-emerald-50 text-emerald-600", icon: "check" as const },
    { title: "กำลังเช่า / ซ่อมบำรุง", value: summary ? `${summary.inUse} / ${summary.maintenance}` : undefined, unit: "คัน", detail: "ไม่รวมจองล่วงหน้าและเตรียมรถ", color: "text-amber-600", background: "bg-amber-50 text-amber-600", icon: "tools" as const },
  ];
  return <section aria-label="ภาพรวมรุ่นรถและฝูงรถ" className="grid grid-cols-2 gap-3 xl:grid-cols-5">{stats.map((stat) => <article key={stat.title} className="flex items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm last:col-span-2 sm:p-5 xl:last:col-span-1"><div><p className="text-[11px] font-medium text-slate-500">{stat.title}</p><p className={`mt-2 text-2xl font-bold ${stat.color}`}>{loading ? "—" : stat.value ?? "—"}<span className="ml-1.5 text-xs font-normal text-slate-400">{stat.unit}</span></p><p className="mt-2 text-[10px] leading-5 text-slate-400">{stat.detail}</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.background}`}><AdminIcon name={stat.icon} className="h-5 w-5" /></span></article>)}</section>;
}
