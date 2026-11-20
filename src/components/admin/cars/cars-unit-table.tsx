"use client";

import type { InventoryStatus, CarUnit } from "@/lib/cars";
import { inventoryStatusLabels } from "@/lib/cars-view";
import { money } from "@/lib/rental";

export type UnitActions = {
  onEdit: (unit: CarUnit) => void;
  onHistory: (unit: CarUnit) => void;
  onTransfer: (unit: CarUnit) => void;
  onStatus: (unit: CarUnit) => void;
};
const statusColors: Record<InventoryStatus, string> = {
  AVAILABLE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  IN_USE: "border-blue-200 bg-blue-50 text-blue-700",
  RESERVED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  OVERDUE: "border-red-200 bg-red-50 text-red-700",
  CLEANING: "border-amber-200 bg-amber-50 text-amber-700",
  MAINTENANCE: "border-red-200 bg-red-50 text-red-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  UNASSIGNED: "border-slate-200 bg-slate-100 text-slate-600",
};
export function UnitStatus({ unit }: { unit: CarUnit }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusColors[unit.inventoryStatus]}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {inventoryStatusLabels[unit.inventoryStatus]}
    </span>
  );
}

export function CarsUnitTable({
  units,
  compact = false,
  ...actions
}: { units: CarUnit[]; compact?: boolean } & UnitActions) {
  return (
    <div className="custom-scroll overflow-x-auto">
      <table
        className={`w-full text-left text-xs ${compact ? "min-w-[760px]" : "min-w-[1080px]"}`}
      >
        <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-3">
              เลขทะเบียนรถ
            </th>
            {!compact && (
              <>
                <th scope="col" className="px-3 py-3">
                  รุ่นรถยนต์
                </th>
                <th scope="col" className="px-3 py-3">
                  สาขาปัจจุบัน / ประเทศ
                </th>
              </>
            )}
            <th scope="col" className="px-3 py-3">
              สี / ปี / เลขไมล์
            </th>
            {compact ? (
              <th scope="col" className="px-3 py-3">
                เลขตัวถัง (VIN)
              </th>
            ) : (
              <>
                <th scope="col" className="px-3 py-3 text-right">
                  ค่าเช่า / ชม.
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  ค่าเช่า / วัน
                </th>
              </>
            )}
            <th scope="col" className="px-3 py-3 text-center">
              สถานะปัจจุบัน
            </th>
            <th scope="col" className="px-3 py-3 text-right">
              การจัดการคันรถ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {units.map((unit) => (
            <tr
              key={unit.id}
              className={`${unit.inventoryStatus === "MAINTENANCE" ? "bg-red-50/30" : "hover:bg-slate-50/70"}`}
            >
              <td className="px-3 py-3.5">
                <p className="whitespace-nowrap font-mono font-semibold text-slate-900">
                  {unit.licensePlate}
                </p>
                {!compact && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {unit.provider}
                  </p>
                )}
              </td>
              {!compact && (
                <>
                  <td className="px-3 py-3.5">
                    <p className="min-w-36 font-medium text-slate-800">
                      {unit.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {unit.category} ·{" "}
                      {unit.steering === "right" ? "RHD" : "LHD"}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="max-w-52 text-slate-700">
                      {unit.location?.nameTh || "ยังไม่จัดสาขา"}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {unit.country}
                      {unit.homeLocationId &&
                        unit.homeLocationId !== unit.locationId &&
                        " · คืนต่างสาขา"}
                    </p>
                  </td>
                </>
              )}
              <td className="whitespace-nowrap px-3 py-3.5">
                <p className="text-slate-700">
                  {unit.exteriorColor || "—"}{" "}
                  <span className="text-slate-300">/</span> {unit.year}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {unit.odometerKm == null
                    ? "—"
                    : `${unit.odometerKm.toLocaleString("th-TH")} km`}
                </p>
              </td>
              {compact ? (
                <td className="px-3 py-3.5 font-mono text-[10px] text-slate-400">
                  {unit.vin || "—"}
                </td>
              ) : (
                <>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right font-medium">
                    {money(unit.hour)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-right font-semibold text-blue-600">
                    {money(unit.day)}
                  </td>
                </>
              )}
              <td className="px-3 py-3.5 text-center">
                <UnitStatus unit={unit} />
                {unit.hasBookings &&
                  ["MAINTENANCE", "INACTIVE", "CLEANING"].includes(
                    unit.inventoryStatus,
                  ) && (
                    <p className="mt-1 text-[10px] text-blue-600">
                      มีรายการจองค้าง
                    </p>
                  )}
                {compact &&
                  unit.homeLocationId &&
                  unit.homeLocationId !== unit.locationId && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      คืนต่างสาขา
                    </p>
                  )}
              </td>
              <td className="px-3 py-3.5">
                <div className="flex max-w-64 flex-wrap justify-end gap-x-3 gap-y-2 text-[11px]">
                  <button
                    onClick={() => actions.onEdit(unit)}
                    aria-label={`แก้ไข ${unit.licensePlate}`}
                    className="text-blue-600 hover:underline"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => actions.onHistory(unit)}
                    aria-label={`ประวัติ ${unit.licensePlate}`}
                    className="text-slate-500 hover:underline"
                  >
                    ประวัติ / ตาราง
                  </button>
                  <button
                    onClick={() => actions.onTransfer(unit)}
                    aria-label={`ย้ายสาขา ${unit.licensePlate}`}
                    className="text-indigo-600 hover:underline"
                  >
                    ย้ายสาขา
                  </button>
                  <button
                    onClick={() => actions.onStatus(unit)}
                    aria-label={`จัดการสถานะ ${unit.licensePlate}`}
                    className="text-amber-700 hover:underline"
                  >
                    สถานะ / แจ้งซ่อม
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!units.length && (
        <p className="p-6 text-center text-xs text-slate-400">
          ยังไม่มีคันรถที่ตรงกับตัวกรองในสาขานี้
        </p>
      )}
    </div>
  );
}
