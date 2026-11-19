"use client";

import { CarVisual, CarSpecs, Features } from "./car-card";
import { type Car, money } from "@/lib/rental";
import { Dialog } from "@/components/shared/dialog";

export function CarDetails({
  car,
  onClose,
  onBook,
}: {
  car: Car;
  onClose: () => void;
  onBook: (car: Car) => void;
}) {
  return (
    <Dialog title={car.name} onClose={onClose}>
      <div className="space-y-4">
        <CarVisual car={car} compact />
        <p className="text-sm text-slate-600">{car.description}</p>
        <CarSpecs car={car} detailed />
        <Features car={car} />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p>ผู้ให้บริการ: {car.provider}</p>
          <p className="mt-2">
            รายวัน <strong>{money(car.day)}</strong> / วัน{" "}
            <span className="mx-2 text-slate-300">|</span> รายชั่วโมง{" "}
            <strong className="text-blue-600">{money(car.hour)}</strong> / ชม.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            เกิน 8 ชม. คิด 1 วัน • คืนหลัง 14:00 น. คิดรายวันสำหรับเศษเวลา •
            การจองต้องได้รับอนุมัติจากแอดมิน
          </p>
        </div>
        <button className="btn-primary w-full py-3" onClick={() => onBook(car)}>
          จองรถคันนี้ทันที →
        </button>
      </div>
    </Dialog>
  );
}
