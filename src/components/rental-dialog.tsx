"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CarVisual, CarSpecs, Features } from "./car-card";
import { type Car, money } from "@/lib/rental";

export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
      className={`rental-dialog m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] ${wide ? "max-w-5xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id="dialog-title" className="text-xl font-bold text-slate-900">
          {title}
        </h2>
        <button
          aria-label="ปิดหน้าต่าง"
          onClick={onClose}
          className="shrink-0 rounded px-1 text-xl text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}

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

