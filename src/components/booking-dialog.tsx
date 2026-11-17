"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "./rental-dialog";
import { api, ApiError, signIn, type Member } from "@/lib/account";
import { bookingInstant } from "@/lib/booking-time";
import { money, resolveLocation, type Car, type Country, type SearchCriteria } from "@/lib/rental";

type Calculation = { totalPrice: number; days: number; hours: number; breakdown: string };
type Booking = { id: string; bookingNumber: string; totalPrice: string | number; status: string };

export function BookingDialog({
  car, criteria, countries, member, sessionLoading, onMemberChange, onClose,
  initialTab = "login", authOnly = false,
}: {
  car?: Car;
  criteria: SearchCriteria;
  countries: Country[];
  member: Member | null;
  sessionLoading: boolean;
  onMemberChange: (member: Member | null) => void;
  onClose: () => void;
  initialTab?: "login" | "register";
  authOnly?: boolean;
}) {
  const [tab, setTab] = useState(initialTab);
  const [dates, setDates] = useState(criteria);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ message: string; booking?: Booking; warning?: string } | null>(null);
  const [quote, setQuote] = useState<{ key: string; calculation: Calculation } | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [openedAt] = useState(() => Date.now());
  const locations = countries.find((country) => country.code === car?.country)?.locations ?? [];
  const pickup = car?.location ?? locations.find((location) => location.id === car?.locationId);
  const [dropoffId, setDropoffId] = useState(() => {
    return resolveLocation(locations, criteria.dropoffLocationId, criteria.return_location)?.id ?? pickup?.id ?? "";
  });
  const dropoff = locations.find((location) => location.id === dropoffId);
  let start = "", end = "", dateError = "";
  if (!authOnly) {
    try {
      if (!pickup?.timeZone) throw new Error("ไม่พบสถานที่รับรถ กรุณาเลือกรถใหม่");
      start = bookingInstant(dates.pickup_date, dates.pickup_time, pickup.timeZone);
      end = bookingInstant(dates.return_date, dates.return_time, dropoff?.timeZone || pickup.timeZone);
      if (end <= start) throw new Error("วันและเวลาคืนรถต้องหลังวันและเวลารับรถ");
      if (Date.parse(start) <= openedAt) throw new Error("กรุณาเลือกวันและเวลารับรถในอนาคต");
    } catch (cause) { dateError = (cause as Error).message; }
  }
  const quoteKey = !dateError && car ? `${car.id}|${start}|${end}|${dropoffId}` : "";
  const calculation = quote?.key === quoteKey ? quote.calculation : null;
  useEffect(() => {
    if (!quoteKey || authOnly || !car) return;
    let active = true;
    const timer = setTimeout(() => {
      setQuoteError("");
      api<{ data: { calculation: Calculation } }>("/api/bookings/calculate", {
        ...(car.carModelLocationId ? { carModelLocationId: car.carModelLocationId } : { carId: car.id }),
        startDateTime: start, endDateTime: end, pickupLocationId: pickup?.id, dropoffLocationId: dropoffId,
      }).then((data) => { if (active) setQuote({ key: quoteKey, calculation: data.data.calculation }); })
        .catch((cause: Error) => { if (active) setQuoteError(cause.message); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [quoteKey, authOnly, car, start, end, quoteRetry, pickup?.id, dropoffId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const email = value("email");
    const password = String(form.get("password") ?? "");
    const registration = {
      email, password, firstName: value("given-name"), lastName: value("family-name"),
      name: `${value("given-name")} ${value("family-name")}`.trim(), phoneNumber: value("tel"),
    };
    setError("");
    inFlight.current = true;
    setBusy(true);
    try {
      if (!member && tab === "login") {
        onMemberChange(await signIn(email, password));
        if (authOnly) setResult({ message: "เข้าสู่ระบบสำเร็จ" });
        return;
      }
      if (authOnly) {
        await api("/api/auth/register", registration);
        setResult({ message: "สมัครสมาชิกสำเร็จ" });
        try { onMemberChange(await signIn(email, password)); }
        catch { setResult({ message: "สมัครสมาชิกสำเร็จ", warning: "กรุณาปิดหน้าต่างแล้วเข้าสู่ระบบด้วยบัญชีที่เพิ่งสมัคร" }); }
        return;
      }
      if (dateError || !calculation || !car || !pickup || !dropoffId) {
        throw new Error(dateError || "กรุณาตรวจสอบสถานที่และรอระบบคำนวณราคาก่อนยืนยัน");
      }
      const booked = await api<{ data: Booking }>("/api/bookings", {
        ...(car.carModelLocationId ? { carModelLocationId: car.carModelLocationId } : { carId: car.id }),
        startDateTime: start, endDateTime: end,
        pickupLocationId: pickup.id, dropoffLocationId: dropoffId,
        driverName: value("driverName"), internationalDrivingPermit: value("license"),
        quotedTotal: calculation.totalPrice,
        ...(!member ? { registerUser: registration } : {}),
      });
      setResult({ message: "บันทึกรายการจองสำเร็จ", booking: booked.data });
      if (!member) {
        try { onMemberChange(await signIn(email, password)); }
        catch { setResult({ message: "บันทึกรายการจองสำเร็จ", booking: booked.data, warning: "บัญชีและรายการจองบันทึกแล้ว กรุณาเข้าสู่ระบบอีกครั้งภายหลัง" }); }
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401 && member) onMemberChange(null);
      if (cause instanceof ApiError && cause.status === 409) { setQuote(null); setQuoteRetry((value) => value + 1); }
      setError((cause as Error).message);
    } finally { inFlight.current = false; setBusy(false); }
  };
  const credentialsNeeded = !member || authOnly;
  const registering = credentialsNeeded && tab === "register";
  const confirming = !authOnly && (Boolean(member) || registering);
  const field = (label: string, name: string, type = "text", autoComplete = name, defaultValue?: string) => (
    <label className="block text-xs font-medium text-slate-700">
      {label}
      <input required name={name} type={type} defaultValue={defaultValue}
        minLength={type === "password" ? (registering ? 8 : 1) : undefined}
        maxLength={type === "password" ? 128 : name === "email" ? 254 : name === "tel" ? 30 : 100}
        autoComplete={autoComplete} className="form-input mt-1" />
    </label>
  );
  return (
    <Dialog title={authOnly ? (tab === "login" ? "เข้าสู่ระบบ FUNCH" : "สมัครสมาชิก FUNCH") : `จอง ${car?.name ?? "รถยนต์"}`} onClose={() => { if (!inFlight.current) onClose(); }}>
      {result ? (
        <div role="status" className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-900">{result.message}</h3>
          {result.booking && <div className="space-y-2 text-sm text-emerald-900">
            <p>เลขที่การจอง: <strong className="break-all">{result.booking.bookingNumber}</strong></p>
            <p>ยอดรวม: <strong>{money(Number(result.booking.totalPrice))}</strong></p>
            <p>สถานะ: รอแอดมินอนุมัติ (PENDING)</p>
            <p>กรุณาเก็บเลขที่การจองไว้สำหรับติดต่อเจ้าหน้าที่</p>
          </div>}
          {result.warning && <p className="text-sm text-amber-800">{result.warning}</p>}
          <button type="button" onClick={onClose} disabled={busy} className="btn-primary px-4 py-2 text-xs">ปิดหน้าต่าง</button>
        </div>
      ) : <>
        {credentialsNeeded && <div role="tablist" aria-label="รูปแบบสมาชิก" className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {(["login", "register"] as const).map((value) => <button type="button" role="tab" aria-selected={tab === value} key={value} disabled={busy}
            onClick={() => { setTab(value); setError(""); }}
            className={`rounded-lg py-2 ${tab === value ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"}`}>
            {value === "login" ? "สมาชิกเดิม / เข้าสู่ระบบ" : "สมัครสมาชิกใหม่"}
          </button>)}
        </div>}
        <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
          <fieldset disabled={busy || sessionLoading} className="space-y-3">
            {!authOnly && <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <p>จุดรับรถ: <strong>{pickup?.nameTh || pickup?.name || car?.city}</strong></p>
              <p className="text-slate-500">เวลารับรถ: {pickup?.timeZone} · เวลาคืนรถ: {dropoff?.timeZone || pickup?.timeZone}</p>
              {dropoff?.timeZone !== pickup?.timeZone && <p className="text-slate-500">เกณฑ์ราคาคืนหลัง 14:00 น. อิงเขตเวลาของสาขารับรถ</p>}
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["วันที่รับรถ", "pickup_date", "date"], ["เวลารับรถ", "pickup_time", "time"],
                  ["วันที่คืนรถ", "return_date", "date"], ["เวลาคืนรถ", "return_time", "time"],
                ] as const).map(([label, name, type]) => <label key={name} className="block font-medium">{label}
                  <input required aria-label={label} type={type} value={dates[name]} className="form-input mt-1"
                    onChange={(event) => { setDates((current) => ({ ...current, [name]: event.target.value })); setQuoteError(""); }} />
                </label>)}
              </div>
              <label className="block font-medium">สถานที่คืนรถ
                <select required aria-label="สถานที่คืนรถ" value={dropoffId} onChange={(event) => setDropoffId(event.target.value)} className="form-input mt-1">
                  <option value="" disabled>เลือกสถานที่คืนรถ</option>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.nameTh || location.name}</option>)}
                </select>
              </label>
              {calculation && <p className="text-blue-800">ยอดรวมจากระบบ: <strong>{money(calculation.totalPrice)}</strong> ({calculation.days} วัน {calculation.hours} ชั่วโมง) • รอแอดมินอนุมัติ</p>}
              {!calculation && !dateError && !quoteError && <p role="status">กำลังคำนวณราคา…</p>}
              {(dateError || quoteError) && <p role="alert" className="text-rose-700">{dateError || quoteError}</p>}
              {quoteError && <button type="button" onClick={() => { setQuoteError(""); setQuoteRetry((value) => value + 1); }} className="text-blue-700 underline">คำนวณราคาอีกครั้ง</button>}
            </div>}
            {member && !authOnly && <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">จองในชื่อบัญชี {member.name} ({member.email})</p>}
            {credentialsNeeded && <div key={tab} className="space-y-3">
              {registering && <div className="grid grid-cols-2 gap-2">
                {field("ชื่อจริง (ภาษาอังกฤษ)", "given-name")}
                {field("นามสกุล (ภาษาอังกฤษ)", "family-name")}
              </div>}
              {field("อีเมล", "email", "email")}
              {registering && field("เบอร์โทรศัพท์มือถือ", "tel", "tel")}
              {field(registering ? "ตั้งรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)" : "รหัสผ่าน", "password", "password", registering ? "new-password" : "current-password")}
            </div>}
            {confirming && <>
              {field("ชื่อผู้ขับขี่ (ตามใบขับขี่)", "driverName", "text", "name", member?.name)}
              {field("หมายเลขใบขับขี่สากล (International Driving Permit)", "license", "text", "off")}
            </>}
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={busy || sessionLoading || (confirming && (!calculation || Boolean(dateError) || !dropoffId))}
              className="btn-primary w-full py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "กำลังดำเนินการ…" : sessionLoading ? "กำลังตรวจสอบบัญชี…" : authOnly ? (registering ? "สมัครสมาชิก" : "เข้าสู่ระบบ") : confirming ? (registering ? "สมัครสมาชิกและยืนยันจอง" : "ยืนยันจองรถ") : "เข้าสู่ระบบเพื่อจอง"}
            </button>
          </fieldset>
          {!authOnly && <p className="text-center text-[11px] text-slate-500">เมื่อยืนยัน ระบบจะบันทึกคำขอจองและรอแอดมินอนุมัติ</p>}
        </form>
      </>}
    </Dialog>
  );
}
