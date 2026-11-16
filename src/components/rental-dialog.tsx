"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CarVisual, CarSpecs, Features } from "./car-card";
import {
  type Car,
  type SearchCriteria,
  rentalDuration,
  rentalTotal,
  money,
} from "@/lib/rental";

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
      onCancel={onClose}
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

export function BookingDialog({
  car,
  criteria,
  onClose,
  initialTab = "login",
  authOnly = false,
}: {
  car?: Car;
  criteria: SearchCriteria;
  onClose: () => void;
  initialTab?: "login" | "register";
  authOnly?: boolean;
}) {
  const [tab, setTab] = useState(initialTab);
  const [submitted, setSubmitted] = useState(false);
  const duration = rentalDuration(criteria);
  const total = car ? rentalTotal(car, criteria) : null;
  const field = (
    label: string,
    name: string,
    type = "text",
    placeholder = "",
  ) => (
    <label className="block text-xs font-medium text-slate-700">
      {label}
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        minLength={type === "password" ? 8 : undefined}
        autoComplete={
          name === "password"
            ? tab === "register"
              ? "new-password"
              : "current-password"
            : name
        }
        className="form-input mt-1"
      />
    </label>
  );
  return (
    <Dialog
      title={
        authOnly
          ? tab === "login"
            ? "เข้าสู่ระบบ FUNCH"
            : "สมัครสมาชิก FUNCH"
          : (car?.name ?? "จองรถยนต์ FUNCH")
      }
      onClose={onClose}
    >
      {!authOnly && car && (
        <p className="mb-4 text-xs text-slate-500">
          ยอดรวมสุทธิ:{" "}
          <strong className="text-sm text-blue-600">
            {total === null ? "—" : money(total)}
          </strong>{" "}
          ({duration?.label}) • รอแอดมินอนุมัติ
        </p>
      )}
      <div
        role="tablist"
        aria-label="รูปแบบสมาชิก"
        className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold"
      >
        {(["login", "register"] as const).map((value) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === value}
            key={value}
            onClick={() => {
              setTab(value);
              setSubmitted(false);
            }}
            className={`rounded-lg py-2 transition ${tab === value ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
          >
            {value === "login" ? "1. สมาชิกเดิม" : "2. สมาชิกใหม่"}
            {!authOnly && (value === "login" ? " (จองทันที)" : " (จองพร้อมสมัคร)")}
          </button>
        ))}
      </div>
      {submitted ? (
        <div
          role="status"
          className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4"
        >
          <h3 className="font-semibold text-blue-900">ตรวจสอบแบบฟอร์มเรียบร้อย</h3>
          <p className="text-sm text-blue-800">
            นี่คือการทดลองใช้งานหน้าเว็บ ยังไม่ได้
            {authOnly ? "สร้างบัญชีหรือเข้าสู่ระบบ" : "ส่งคำขอจองหรือสร้างบัญชี"}{" "}
            และไม่มีการบันทึกข้อมูลที่กรอก
          </p>
          <button className="btn-primary px-4 py-2 text-xs" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      ) : (
        <form
          key={tab}
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-3"
        >
          <div
            className={`rounded-xl border p-3 text-xs ${tab === "login" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}
          >
            {tab === "login"
              ? "สมาชิกเดิม: เข้าสู่ระบบเพื่อยืนยันข้อมูลผู้ขับขี่"
              : "✨ กรอกข้อมูลครั้งเดียว เพื่อสมัครสมาชิกและเตรียมคำขอจอง"}
          </div>
          {tab === "register" && (
            <div className="grid grid-cols-2 gap-2">
              {field("ชื่อจริง (ภาษาอังกฤษ)", "given-name", "text", "First Name")}
              {field("นามสกุล (ภาษาอังกฤษ)", "family-name", "text", "Last Name")}
            </div>
          )}
          {field("อีเมล", "email", "email", "example@email.com")}
          {tab === "register" &&
            field("เบอร์โทรศัพท์มือถือ", "tel", "tel", "+66 8X-XXX-XXXX")}
          {field(
            tab === "register" ? "ตั้งรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" : "รหัสผ่าน",
            "password",
            "password",
            "อย่างน้อย 8 ตัวอักษร",
          )}
          {!authOnly &&
            field(
              "หมายเลขใบขับขี่สากล (International Driving Permit)",
              "license",
              "text",
              "IDP-TH-2026-XXXX",
            )}
          <button
            type="submit"
            className={`w-full rounded-xl py-3 text-xs font-bold text-white shadow-md transition ${tab === "register" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {authOnly
              ? tab === "login"
                ? "เข้าสู่ระบบ"
                : "สมัครสมาชิก"
              : tab === "login"
                ? "ยืนยันข้อมูลเพื่อเตรียมคำขอจอง"
                : "สมัครสมาชิกและเตรียมคำขอจองพร้อมกัน"}
          </button>
          <p className="text-center text-[10px] text-slate-500">
            แบบฟอร์มตัวอย่าง ยังไม่ส่งข้อมูลหรือสร้างรายการจองจริง
          </p>
        </form>
      )}
    </Dialog>
  );
}
