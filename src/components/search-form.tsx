"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LocationAutocomplete } from "./location-autocomplete";
import {
  countries,
  defaultCriteria,
  getCountry,
  rentalDuration,
  type SearchCriteria,
} from "@/lib/rental";

export function SearchForm({
  initial = defaultCriteria,
  onComplete,
}: {
  initial?: SearchCriteria;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const [criteria, setCriteria] = useState(initial);
  const [differentReturn, setDifferentReturn] = useState(
    Boolean(initial.return_location),
  );
  const [error, setError] = useState("");
  const country = getCountry(criteria.country);
  const locationOptions = [...country.cities, country.location];
  const update = (key: keyof SearchCriteria, value: string) =>
    setCriteria((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rentalDuration(criteria)) {
      setError("กรุณาเลือกวันและเวลาคืนรถให้หลังจากวันและเวลารับรถ");
      return;
    }
    if (
      !criteria.location.trim() ||
      (differentReturn && !criteria.return_location?.trim())
    ) {
      setError("กรุณาระบุสถานที่รับรถและคืนรถให้ครบถ้วน");
      return;
    }
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([key, value]) => {
      if (value && (key !== "return_location" || differentReturn))
        params.set(key, value);
    });
    router.push(`/search?${params}`);
    onComplete?.();
  };
  const timeOptions = Array.from(
    { length: 24 },
    (_, hour) => `${String(hour).padStart(2, "0")}:00`,
  );
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-slate-800 shadow-2xl sm:p-6">
      <div
        aria-label="รูปแบบการเช่า"
        className="mb-5 flex items-center gap-2 overflow-x-auto border-b border-slate-100 pb-4 text-sm sm:gap-4"
      >
        <span className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-600">
          🚘 เช่ารถขับเอง (Self-Drive)
        </span>
        <span
          title="ยังไม่เปิดให้บริการ"
          aria-disabled="true"
          className="shrink-0 px-4 py-2 font-medium text-slate-400"
        >
          👨‍✈️ เช่าพร้อมคนขับ (Chauffeur)
        </span>
        <span
          title="ยังไม่เปิดให้บริการ"
          aria-disabled="true"
          className="shrink-0 px-4 py-2 font-medium text-slate-400"
        >
          🏢 เช่าสำหรับนิติบุคคล
        </span>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="search-field md:col-span-4">
            <label htmlFor="search-country" className="field-label">
              🌏 ประเทศที่จะเดินทางไป (Country)
            </label>
            <select
              id="search-country"
              name="country"
              value={criteria.country}
              onChange={(event) => {
                const country = getCountry(event.target.value);
                setCriteria((current) => ({
                  ...current,
                  country: country.code,
                  location: country.location,
                  return_location: "",
                }));
              }}
              className="w-full cursor-pointer bg-transparent pr-2 text-sm font-medium"
            >
              <option value="" disabled>
                เลือกประเทศ
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.english}) - พวงมาลัย
                  {country.steering === "right" ? "ขวา" : "ซ้าย"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-blue-600">
              ✓ แสดงอัตราค่าบริการและกฎจราจรตามประเทศ
            </p>
          </div>
          <div className="search-field md:col-span-8">
            <label htmlFor="search-location" className="field-label">
              📍 จุดรับรถและคืนรถ (Pick-up / Drop-off City)
            </label>
            <LocationAutocomplete
              key={`pickup-${criteria.country}`}
              id="search-location"
              name="location"
              value={criteria.location}
              options={locationOptions}
              onChange={(value) => update("location", value)}
              placeholder="พิมพ์ชื่อเมือง หรือ สนามบิน"
              className="w-full bg-transparent text-sm font-medium"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                ยอดนิยม: {getCountry(criteria.country).cities.join(", ")}
              </span>
              <label className="flex cursor-pointer items-center gap-1">
                <input
                  type="checkbox"
                  checked={differentReturn}
                  onChange={(event) => setDifferentReturn(event.target.checked)}
                />
                คืนต่างสถานที่
              </label>
            </div>
            {differentReturn && (
              <div className="mt-3 text-xs text-slate-600">
                <label htmlFor="return-location">สถานที่คืนรถ</label>
                <LocationAutocomplete
                  key={`return-${criteria.country}`}
                  id="return-location"
                  name="return_location"
                  value={criteria.return_location ?? ""}
                  options={locationOptions}
                  onChange={(value) => update("return_location", value)}
                  placeholder="พิมพ์ชื่อเมือง หรือ สนามบินที่คืนรถ"
                  className="form-input mt-1"
                />
              </div>
            )}
          </div>
          <div className="search-field md:col-span-6">
            <label htmlFor="pickup-date" className="field-label">
              📅 วันที่และเวลารับรถ (Pick-up)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="pickup-date"
                name="pickup_date"
                aria-label="วันที่รับรถ"
                type="date"
                required
                value={criteria.pickup_date}
                onChange={(event) => update("pickup_date", event.target.value)}
                className="form-input"
              />
              <select
                aria-label="เวลารับรถ"
                name="pickup_time"
                value={criteria.pickup_time}
                onChange={(event) => update("pickup_time", event.target.value)}
                className="form-input"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time} น.
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              เวลาท้องถิ่นของประเทศปลายทาง
            </p>
          </div>
          <div className="search-field md:col-span-6">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
              <label htmlFor="return-date" className="field-label mb-0">
                📅 วันที่และเวลาคืนรถ (Return)
              </label>
              <span className="text-[11px] text-amber-600">
                *ส่งคืนหลัง 14:00 น. คิดเต็มวัน
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                id="return-date"
                name="return_date"
                aria-label="วันที่คืนรถ"
                type="date"
                min={criteria.pickup_date}
                required
                value={criteria.return_date}
                onChange={(event) => update("return_date", event.target.value)}
                className="form-input"
              />
              <select
                aria-label="เวลาคืนรถ"
                name="return_time"
                value={criteria.return_time}
                onChange={(event) => update("return_time", event.target.value)}
                className="form-input"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time} น.{time > "14:00" ? " (คิดเต็มวัน)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <p
              className={`mt-1 text-[11px] ${criteria.return_time > "14:00" ? "text-amber-600" : "text-slate-500"}`}
            >
              {criteria.return_time > "14:00"
                ? `⚠️ คืน ${criteria.return_time} น. (เกิน 14:00 น.) ระบบจะนับวันสุดท้ายเป็น 1 วันเต็ม`
                : "ระบบคำนวณค่าเช่าตามช่วงเวลาที่เลือก"}
            </p>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:flex-row">
          <div className="flex w-full items-center gap-2 rounded-xl border border-blue-200/60 bg-blue-50/70 px-3 py-2 text-xs sm:w-auto">
            <span className="text-base">ℹ️</span>
            <div>
              <strong className="text-blue-900">เกณฑ์คำนวณราคาอัตโนมัติ: </strong>
              <span className="text-slate-600">
                เกิน 8 ชม. = คิด 1 วัน | คืนหลัง 14:00 น. = คิด 1 วันเต็ม
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary flex w-full shrink-0 items-center justify-center gap-2 px-8 py-3.5 text-base shadow-lg shadow-blue-600/30 sm:w-auto"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0"
              />
            </svg>
            ค้นหารถว่าง (Search Cars)
          </button>
        </div>
      </form>
    </div>
  );
}
