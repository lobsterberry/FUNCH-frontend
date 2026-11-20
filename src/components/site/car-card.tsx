"use client";

import {
  type Car,
  type Country,
  money,
  type SearchCriteria,
  rentalDuration,
  rentalTotal,
} from "@/lib/rental";

export function CarVisual({
  car,
  country,
  compact = false,
}: {
  car: Car;
  country: Country | undefined;
  compact?: boolean;
}) {
  const countryName = country?.name ?? car.country;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-linear-to-tr from-slate-100 to-slate-200 p-4 ${compact ? "h-44 rounded-xl" : "h-48"}`}
    >
      <span
        className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 font-semibold text-slate-800 shadow-sm ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {country?.flag && <span>{country.flag}</span>}
        {compact ? countryName : `${car.city}, ${countryName}`}
      </span>
      <span
        className={`absolute top-3 right-3 rounded-md px-2.5 py-0.5 text-[11px] font-medium text-white ${car.fuel === "EV" ? "bg-emerald-600" : "bg-blue-600"}`}
      >
        {car.badge}
      </span>
      <div
        className={`${compact ? "" : "mt-4"} text-center transition duration-300 group-hover:scale-105`}
      >
        <svg
          aria-hidden="true"
          className={`mx-auto ${compact ? "h-20 w-36" : "h-24 w-40"} ${car.color}`}
          viewBox="0 0 100 60"
          fill="currentColor"
        >
          <path
            d={
              car.category === "MPV"
                ? "M9 34 L15 15 Q16 12 24 12 L73 12 Q81 12 85 22 L95 33 L97 44 Q97 46 93 46 L90 46 A8 8 0 0 1 74 46 L36 46 A8 8 0 0 1 20 46 L10 46 Q7 46 7 41 Z"
                : "M10,35 Q15,20 30,18 L60,18 Q75,18 85,28 L95,33 Q98,35 98,40 L98,44 Q98,46 95,46 L90,46 A8,8 0 0,1 74,46 L36,46 A8,8 0 0,1 20,46 L10,46 Q8,46 8,42 L8,38 Q8,35 10,35 Z"
            }
            opacity="0.85"
          />
          <circle cx="28" cy="44" r="7" fill="#475569" />
          <circle cx="82" cy="44" r="7" fill="#475569" />
          <circle cx="28" cy="44" r="3" fill="#cbd5e1" />
          <circle cx="82" cy="44" r="3" fill="#cbd5e1" />
          <rect
            x="33"
            y="21"
            width="18"
            height="11"
            rx="2"
            fill="white"
            opacity="0.6"
          />
          <rect
            x="54"
            y="21"
            width="18"
            height="11"
            rx="2"
            fill="white"
            opacity="0.6"
          />
        </svg>
        <span className="font-mono text-[11px] text-slate-400">
          {car.model}
        </span>
      </div>
      <span className="absolute bottom-2 left-3 rounded bg-slate-900/80 px-2 py-0.5 text-[10px] text-white">
        พวงมาลัย{car.steering === "right" ? "ขวา (RHD)" : "ซ้าย (LHD)"}
      </span>
    </div>
  );
}

export function CarSpecs({
  car,
  detailed = false,
}: {
  car: Car;
  detailed?: boolean;
}) {
  return (
    <div
      className={`grid gap-2 border-y border-slate-100 py-2.5 text-xs text-slate-600 ${detailed ? "grid-cols-2 rounded-xl bg-slate-50 p-2.5 sm:grid-cols-4" : "grid-cols-3"}`}
    >
      <span>👥 {car.seats} ที่นั่ง</span>
      <span>⚙️ {car.gear}</span>
      <span>🧳 กระเป๋า {car.bags} ใบ</span>
      {detailed && (
        <span>
          ⛽{" "}
          {car.fuel === "EV"
            ? "ไฟฟ้า 100%"
            : car.fuel === "Hybrid"
              ? "ไฮบริด"
              : car.fuel === "Diesel"
                ? "ดีเซล"
                : "เบนซิน"}
        </span>
      )}
    </div>
  );
}

export function Features({ car }: { car: Car }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {car.features.map((feature) => (
        <span
          key={feature}
          className={`rounded border px-2 py-0.5 text-[10px] ${feature.includes("ประกัน") ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-blue-100 bg-blue-50 text-blue-700"}`}
        >
          {feature}
        </span>
      ))}
    </div>
  );
}

export function CarCard({
  car,
  country,
  list = false,
  criteria,
  onDetails,
  onBook,
}: {
  car: Car;
  country: Country | undefined;
  list?: boolean;
  criteria?: SearchCriteria;
  onDetails: (car: Car) => void;
  onBook: (car: Car) => void;
}) {
  const duration =
    car.quotedDays !== undefined
      ? {
          label: `${car.quotedDays} วัน ${car.quotedHours || 0} ชั่วโมง`,
          lateReturn: Boolean(criteria && criteria.return_time > "14:00"),
        }
      : (criteria ? rentalDuration(criteria) : null);
  const total = car.quotedTotal ?? (criteria ? rentalTotal(car, criteria) : null);
  if (list)
    return (
      <article className="car-result flex min-w-0 flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5 xl:flex-row">
        <div className="shrink-0 xl:w-64">
          <CarVisual car={car} country={country} compact />
          <p className="mt-2 text-center text-[11px] text-slate-400">
            ผู้ให้บริการ: {car.provider}
            {car.availableCount !== undefined && (
              <span className="mt-1 block text-emerald-700">
                {car.availabilityChecked
                  ? "ว่างตามช่วงเวลาที่เลือก"
                  : "รถเปิดบริการ"}{" "}
                {car.availableCount} คัน · {car.location?.nameTh}
              </span>
            )}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                <button
                  className="text-left hover:text-blue-600"
                  onClick={() => onDetails(car)}
                >
                  {car.name}
                </button>
              </h2>
              <span className="whitespace-nowrap text-xs font-bold text-amber-500">
                ★ {car.rating}{" "}
                <span className="font-normal text-slate-400">
                  ({car.reviews})
                </span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{car.description}</p>
            <div className="my-3">
              <CarSpecs car={car} detailed />
            </div>
            <Features car={car} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs">
            <span className="font-medium text-emerald-600">
              {car.availabilityChecked
                ? "✓ รถว่างตามช่วงเวลาที่เลือก • รอแอดมินอนุมัติการจอง"
                : "เลือกวันและเวลาเช่าเพื่อตรวจสอบรถว่าง"}
            </span>
            <button
              onClick={() => onDetails(car)}
              className="text-[11px] font-medium text-blue-600 hover:underline"
            >
              ดูรายละเอียดรถทั้งหมด →
            </button>
          </div>
        </div>
        <div className="flex shrink-0 flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-4 xl:w-64">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-wider text-slate-500">
              อัตราค่าบริการ
            </p>
            <div className="flex items-baseline justify-between border-b border-slate-200 pb-2 text-xs">
              <span>รายวัน:</span>
              <strong className="text-sm text-slate-900">
                {money(car.day)}{" "}
                <span className="text-[10px] font-normal text-slate-500">
                  /วัน
                </span>
              </strong>
            </div>
            <div className="flex items-baseline justify-between border-b border-slate-200 py-1.5 text-xs">
              <span>รายชั่วโมง:</span>
              <strong className="text-blue-600">
                {money(car.hour)}{" "}
                <span className="text-[10px] font-normal">/ชม.</span>
              </strong>
            </div>
            {total !== null && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-white p-2">
                <p className="text-[10px] text-slate-500">
                  คำนวณตามทริป{duration && ` (${duration.label})`}
                </p>
                <p className="text-xl font-bold text-blue-600">{money(total)}</p>
                <p className="mt-0.5 text-[9px] text-slate-500">
                  {duration?.lateReturn
                    ? "*คืนเกิน 14:00 น. ใช้อัตรารายวันสำหรับเศษเวลา"
                    : "*คำนวณตามเวลาท้องถิ่นของปลายทาง"}
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => onBook(car)}
              className="btn-primary w-full py-2.5 text-xs"
            >
              {total === null ? "เลือกวันและเวลาเช่า →" : "จองรถรุ่นนี้ →"}
            </button>
            <p className="text-center text-[10px] text-slate-500">
              เข้าสู่ระบบแล้วจองทันที หรือ สมัครใหม่พร้อมจอง
            </p>
          </div>
        </div>
      </article>
    );
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl">
      <CarVisual car={car} country={country} />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="font-bold text-amber-500">
              ★ {car.rating}{" "}
              <span className="font-normal text-slate-400">
                ({car.reviews} รีวิว)
              </span>
            </span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
              {car.availableCount !== undefined
                ? `${car.availabilityChecked ? "ว่าง" : "เปิดบริการ"} ${car.availableCount} คัน`
                : "● พร้อมให้บริการ"}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 transition group-hover:text-blue-600">
            {car.name}
          </h3>
          <p className="mb-3 text-xs text-slate-500">{car.description}</p>
          <CarSpecs car={car} />
          <div className="my-4">
            <Features car={car} />
          </div>
        </div>
        <div className="border-t border-slate-100 pt-2">
          <div className="mb-3 rounded-xl border border-slate-200/80 bg-slate-50 p-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <div>
                <span className="text-xs text-slate-500">รายวัน: </span>
                <strong className="text-lg text-slate-900">
                  {money(car.day)}
                </strong>
                <span className="text-xs text-slate-400"> /วัน</span>
              </div>
              <div>
                <span className="text-xs text-slate-500">รายชั่วโมง: </span>
                <strong className="text-sm text-blue-600">
                  {money(car.hour)}
                </strong>
                <span className="text-[11px] text-slate-400"> /ชม.</span>
              </div>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              *ใช้เกิน 8 ชม. ปรับเป็น 1 วัน • คืนหลัง 14:00 น. คิดรายวัน
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onDetails(car)}
              className="rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              ดูรายละเอียด
            </button>
            <button
              onClick={() => onBook(car)}
              className="btn-primary py-2 text-xs"
            >
              {total === null ? "เลือกวันและเวลาเช่า" : "จองทันที"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
