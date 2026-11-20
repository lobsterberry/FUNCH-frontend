"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  getCountry,
  getSearchCities,
  money,
  rentalDuration,
  type Car,
  type Country,
  type SearchCriteria,
} from "@/lib/rental";
import { CarCard } from "./car-card";
import { RentalDurationBadge } from "./rental-duration-badge";

type Filters = {
  country: string;
  cities: string[];
  categories: string[];
  steering: string;
  transmission: string[];
  seats: string[];
  fuels: string[];
  features: string[];
  priceMode: "day" | "hour";
  maxPrice: number;
};
const freshFilters = (
  criteria: SearchCriteria,
  countries: Country[] = [],
): Filters => ({
  country: criteria.country || "all",
  cities: getSearchCities(criteria, countries),
  categories: [],
  steering: "all",
  transmission: [],
  seats: [],
  fuels: [],
  features: [],
  priceMode: "day",
  maxPrice: 8000,
});
const categoryOptions = [
  { id: "SUV", label: "SUV / Crossover" },
  { id: "Sedan", label: "Sedan (เก๋ง 4 ประตู)" },
  { id: "MPV", label: "MPV / รถตู้ครอบครัว 7 ที่นั่ง" },
  { id: "EV", label: "EV ไฟฟ้า 100%" },
  { id: "Luxury", label: "Luxury / รถหรู" },
];
const featureOptions = [
  "GPS เมนูอังกฤษ",
  "Apple CarPlay",
  "กล้องรอบคัน 360°",
  "ETC Card Reader",
  "รวมประกันภัยพื้นฐาน",
];

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="filter-group">
      <legend className="float-left mb-2.5 w-full text-xs font-bold tracking-wider text-slate-700">
        {title}
      </legend>
      <div className="clear-both space-y-2 text-xs text-slate-600">
        {children}
      </div>
    </fieldset>
  );
}

export function SearchResults({
  countries = [],
  cars = [],
  criteria,
  onDetails,
  onBook,
  onEdit,
}: {
  countries?: Country[];
  cars?: Car[];
  criteria: SearchCriteria;
  onDetails: (car: Car) => void;
  onBook: (car: Car) => void;
  onEdit: (criteria: SearchCriteria) => void;
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(() =>
    freshFilters(criteria, countries),
  );
  const [mobileFilters, setMobileFilters] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const availabilitySearch = Boolean(criteria.pickup_date);
  const duration = rentalDuration(criteria);
  const country = getCountry(filters.country, countries);
  const baseCars = cars.filter(
    (car) => filters.country === "all" || car.country === filters.country,
  );
  const availableFeatures = Array.from(
    new Set(baseCars.flatMap((car) => car.features).filter(Boolean)),
  );
  const activeFeatureOptions =
    availableFeatures.length > 0
      ? availableFeatures.slice(0, 8)
      : featureOptions;
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const toggle = (
    key:
      | "cities"
      | "categories"
      | "transmission"
      | "seats"
      | "fuels"
      | "features",
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
    setPage(1);
  };
  const filtered = baseCars
    .filter(
      (car) =>
        (!filters.cities.length || filters.cities.includes(car.city)) &&
        (!filters.categories.length ||
          filters.categories.includes(car.category) ||
          car.categories?.some((category) =>
            filters.categories.includes(category),
          ) ||
          (filters.categories.includes("EV") && car.fuel === "EV")) &&
        (filters.steering === "all" || car.steering === filters.steering) &&
        (!filters.transmission.length ||
          filters.transmission.includes(
            car.transmissionType === "MANUAL" ? "manual" : "automatic",
          )) &&
        (!filters.seats.length ||
          filters.seats.some((seats) =>
            seats === "5"
              ? car.seats <= 5
              : seats === "7"
                ? car.seats === 7
                : car.seats >= 8,
          )) &&
        (!filters.fuels.length || filters.fuels.includes(car.fuel)) &&
        filters.features.every((feature) => car.features.includes(feature)) &&
        car[filters.priceMode] <= filters.maxPrice,
    )
    .sort((a, b) =>
      sort === "price_asc"
        ? a.day - b.day
        : sort === "price_desc"
          ? b.day - a.day
          : sort === "rating"
            ? b.rating - a.rating
            : 0,
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 4));
  const shown = filtered.slice((page - 1) * 4, page * 4);
  const checkbox = (
    key:
      | "cities"
      | "categories"
      | "transmission"
      | "seats"
      | "fuels"
      | "features",
    id: string,
    label: string,
    count?: number,
  ) => (
    <label
      key={id}
      className="flex cursor-pointer items-center justify-between gap-2 hover:text-blue-600"
    >
      <span className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={filters[key].includes(id)}
          onChange={() => toggle(key, id)}
        />
        <span>{label}</span>
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-slate-400">{count}</span>
      )}
    </label>
  );
  const dateLabel = (date: string, time: string) => {
    const parsed = new Date(`${date}T00:00:00Z`);
    return Number.isFinite(parsed.getTime())
      ? `${new Intl.DateTimeFormat("th-TH-u-ca-gregory", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(parsed)} (${time})`
      : "วันที่ไม่ถูกต้อง";
  };
  const reset = () => {
    setFilters(freshFilters(criteria, countries));
    setPage(1);
  };
  const tags = [
    ...(filters.country !== "all" && country
      ? [
          {
            label: `${country.flag} ${country.name}`,
            clear: () => router.push("/search?country=all"),
          },
        ]
      : []),
    ...filters.cities.map((value) => ({
      label: value,
      clear: () => toggle("cities", value),
    })),
    ...filters.categories.map((value) => ({
      label:
        categoryOptions.find((option) => option.id === value)?.label ?? value,
      clear: () => toggle("categories", value),
    })),
    ...filters.fuels.map((value) => ({
      label: value,
      clear: () => toggle("fuels", value),
    })),
    ...(filters.steering !== "all"
      ? [
          {
            label: `พวงมาลัย${filters.steering === "right" ? "ขวา" : "ซ้าย"}`,
            clear: () => update("steering", "all"),
          },
        ]
      : []),
  ];
  return (
    <main id="main-content" className="flex-1">
      <section className="border-b border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs sm:text-sm lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2 text-slate-700">
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50 px-3 py-1.5 font-medium text-blue-800">
              <span className="text-base">
                {filters.country === "all" ? "🌍" : (country?.flag ?? "🌍")}
              </span>
              <strong>
                {filters.country === "all"
                  ? "ทุกประเทศ"
                  : `${country?.name ?? filters.country}:`}
              </strong>
              {criteria.location && <span>{criteria.location}</span>}
            </div>
            {availabilitySearch && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700">
                <span>
                  📅 {dateLabel(criteria.pickup_date, criteria.pickup_time)}
                </span>
                <span className="text-slate-400">➔</span>
                <span>
                  {dateLabel(criteria.return_date, criteria.return_time)}
                </span>
              </div>
            )}
            {duration && <RentalDurationBadge duration={duration} />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              aria-expanded={mobileFilters}
              aria-controls="filter-sidebar"
              onClick={() => setMobileFilters(!mobileFilters)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 md:hidden"
            >
              ☷ ตัวกรอง (Filters)
            </button>
            <button
              onClick={() => onEdit(criteria)}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
            >
              {availabilitySearch ? "✏️ แก้ไขการค้นหา" : "เลือกวันและเวลาเช่า"}
            </button>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
          <aside
            id="filter-sidebar"
            aria-label="ตัวกรองรถยนต์"
            className={`custom-scroll space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:sticky md:top-20 md:col-span-4 md:block md:max-h-[calc(100dvh-100px)] md:overflow-y-auto lg:col-span-3 ${mobileFilters ? "block" : "hidden"}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                <span className="mr-2 text-blue-600">☷</span>ตัวกรองเพิ่มเติม
              </h2>
              <button
                onClick={reset}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                ล้างตัวกรอง
              </button>
            </div>
            <div className="space-y-3">
              <label
                htmlFor="filter-country"
                className="text-xs font-bold tracking-wider text-slate-700"
              >
                🌏 ประเทศและเมืองปลายทาง
              </label>
              <select
                id="filter-country"
                value={filters.country}
                onChange={(event) => {
                  const countryCode = event.target.value;
                  if (!availabilitySearch || countryCode === "all") {
                    router.push(`/search?${new URLSearchParams({ country: countryCode })}`);
                    return;
                  }
                  onEdit({
                    ...criteria,
                    country: countryCode,
                    location: "",
                    locationId: undefined,
                    return_location: undefined,
                    dropoffLocationId: undefined,
                  });
                }}
                className="form-input bg-slate-50"
              >
                <option value="all">ทุกประเทศ</option>
                {countries.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.flag} {item.name} ({item.english})
                  </option>
                ))}
              </select>
              {filters.country !== "all" && country && (
                <div className="space-y-2 text-xs text-slate-600">
                  {country.cities.map((city) =>
                    checkbox(
                      "cities",
                      city,
                      city,
                      baseCars.filter((car) => car.city === city).length,
                    ),
                  )}
                </div>
              )}
            </div>
            <FilterGroup title="💰 ช่วงราคา">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-slate-500">ราคาสูงสุด</span>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[10px]">
                  {(["day", "hour"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setFilters((current) => ({
                          ...current,
                          priceMode: mode,
                          maxPrice: mode === "day" ? 8000 : 1000,
                        }));
                        setPage(1);
                      }}
                      className={`rounded-md px-2 py-0.5 ${filters.priceMode === mode ? "bg-white font-bold text-blue-600 shadow-xs" : "text-slate-600"}`}
                    >
                      {mode === "day" ? "รายวัน" : "ราย ชม."}
                    </button>
                  ))}
                </div>
              </div>
              <input
                aria-label="ราคาสูงสุด"
                type="range"
                min="0"
                max={filters.priceMode === "day" ? 8000 : 1000}
                step="50"
                value={filters.maxPrice}
                onChange={(event) =>
                  update("maxPrice", Number(event.target.value))
                }
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
              <div className="flex justify-between text-[11px]">
                <span>฿0</span>
                <strong className="text-blue-600">
                  ไม่เกิน {money(filters.maxPrice)} /{" "}
                  {filters.priceMode === "day" ? "วัน" : "ชม."}
                </strong>
              </div>
            </FilterGroup>
            <FilterGroup title="🚗 ประเภทรถยนต์">
              {categoryOptions.map((option) =>
                checkbox(
                  "categories",
                  option.id,
                  option.label,
                  baseCars.filter((car) =>
                    option.id === "EV"
                      ? car.fuel === "EV"
                      : car.category === option.id,
                  ).length,
                ),
              )}
            </FilterGroup>
            <FilterGroup title="🛞 ตำแหน่งพวงมาลัย">
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "right", label: "พวงมาลัยขวา (RHD)" },
                { id: "left", label: "พวงมาลัยซ้าย (LHD)" },
              ].map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="steering"
                    value={item.id}
                    checked={filters.steering === item.id}
                    onChange={() => update("steering", item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </FilterGroup>
            <FilterGroup title="⚙️ ระบบเกียร์">
              {checkbox("transmission", "automatic", "อัตโนมัติ (Automatic)")}
              {checkbox("transmission", "manual", "ธรรมดา (Manual)")}
            </FilterGroup>
            <FilterGroup title="👥 จำนวนที่นั่ง">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "5", label: "4-5 ที่นั่ง" },
                  { id: "7", label: "7 ที่นั่ง" },
                  { id: "8", label: "8+ ที่นั่ง" },
                ].map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={filters.seats.includes(item.id)}
                    onClick={() => toggle("seats", item.id)}
                    className={`rounded-lg border px-1 py-1.5 text-[11px] ${filters.seats.includes(item.id) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title="⛽ ประเภทเชื้อเพลิง">
              {[
                { id: "Petrol", label: "เบนซิน (Gasoline / Petrol)" },
                { id: "Diesel", label: "ดีเซล (Diesel)" },
                { id: "Hybrid", label: "ไฮบริด (Hybrid)" },
                { id: "EV", label: "ไฟฟ้า 100% (EV)" },
              ].map((item) =>
                checkbox(
                  "fuels",
                  item.id,
                  item.label,
                  baseCars.filter((car) =>
                    item.id === "Petrol"
                      ? car.fuel === "Petrol" || car.fuel === "Gasoline"
                      : car.fuel === item.id,
                  ).length,
                ),
              )}
            </FilterGroup>
            <FilterGroup title="✨ ออปชั่นและคุณสมบัติเด่น">
              {activeFeatureOptions.map((feature) =>
                checkbox(
                  "features",
                  feature,
                  feature,
                  baseCars.filter((car) => car.features.includes(feature))
                    .length,
                ),
              )}
            </FilterGroup>
            <div className="border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  setMobileFilters(false);
                  document
                    .getElementById("results-heading")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="btn-primary w-full py-2.5 text-xs shadow-md"
              >
                แสดงผลลัพธ์ ({filtered.length} รายการ)
              </button>
            </div>
          </aside>
          <section
            aria-labelledby="results-heading"
            className="min-w-0 space-y-4 md:col-span-8 lg:col-span-9"
          >
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs xl:flex-row xl:items-center">
              <div>
                <h1
                  id="results-heading"
                  aria-live="polite"
                  className="scroll-mt-24 text-sm font-bold text-slate-900"
                >
                  พบรถทั้งหมด{" "}
                  <span className="text-blue-600">
                    {filtered.length} รายการ
                  </span>{" "}
                  <span className="text-xs font-normal text-slate-500">
                    • ข้อมูลรถตัวอย่าง
                  </span>
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag.label}
                      className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                    >
                      {tag.label}
                      <button
                        aria-label={`ลบตัวกรอง ${tag.label}`}
                        onClick={tag.clear}
                        className="ml-1 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5">
                  <span className="text-slate-500">จัดเรียงตาม:</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-700"
                  >
                    <option value="recommended">แนะนำ (ความนิยมสูงสุด)</option>
                    <option value="price_asc">ราคา: ต่ำสุดไปสูงสุด</option>
                    <option value="price_desc">ราคา: สูงสุดไปต่ำสุด</option>
                    <option value="rating">คะแนนรีวิวสูงสุด</option>
                  </select>
                </label>
                <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:flex">
                  {(["list", "grid"] as const).map((mode) => (
                    <button
                      key={mode}
                      aria-label={
                        mode === "list" ? "มุมมองรายการ" : "มุมมองการ์ด"
                      }
                      aria-pressed={view === mode}
                      onClick={() => setView(mode)}
                      className={`rounded-md px-2 py-1 text-base ${view === mode ? "bg-white text-blue-600 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      {mode === "list" ? "☰" : "▦"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {duration ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/80 bg-linear-to-r from-blue-50 to-indigo-50 p-3 text-xs sm:p-4">
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0 text-xl">💡</span>
                  <p>
                    <strong className="text-blue-900">
                      การคำนวณราคาทริปนี้:{" "}
                    </strong>
                    <span className="text-slate-700">
                      คุณเลือกระยะเวลา {duration.elapsedDays} วัน{" "}
                      {duration.elapsedHours} ชม.{" "}
                      {duration.lateReturn && (
                        <>
                          เวลาคืนรถคือ{" "}
                          <strong>
                            {criteria.return_time} น. (เกิน 14:00 น.)
                          </strong>{" "}
                        </>
                      )}
                      ระบบคำนวณค่าเช่าเท่ากับ <strong>{duration.label}</strong>{" "}
                      ตามเกณฑ์มาตรฐาน
                    </span>
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700 xl:inline-block">
                  โปร่งใส ไม่มีชาร์จแฝง
                </span>
              </div>
            ) : null}
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-4 xl:grid-cols-2"
                  : "space-y-4"
              }
            >
              {shown.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  country={getCountry(car.country, countries)}
                  list={view === "list"}
                  criteria={availabilitySearch ? criteria : undefined}
                  onDetails={onDetails}
                  onBook={onBook}
                />
              ))}
            </div>
            {!filtered.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <span className="text-4xl">🔎</span>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                  ไม่พบรถที่ตรงกับตัวกรอง
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  ลองเปลี่ยนประเทศ ช่วงราคา หรือออปชั่นที่ต้องการ
                </p>
                <button
                  onClick={reset}
                  className="btn-primary mt-5 px-5 py-2 text-sm"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
            <nav
              aria-label="หน้าผลการค้นหา"
              className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs"
            >
              <p className="text-slate-500">
                แสดง {filtered.length ? (page - 1) * 4 + 1 : 0} -{" "}
                {Math.min(page * 4, filtered.length)} จาก {filtered.length}{" "}
                รายการ
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  aria-label="หน้าก่อนหน้า"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5"
                >
                  ←
                </button>
                {Array.from({ length: pages }, (_, index) => index + 1).map(
                  (number) => (
                    <button
                      key={number}
                      aria-current={page === number ? "page" : undefined}
                      onClick={() => setPage(number)}
                      className={`rounded-lg border px-3 py-1.5 ${page === number ? "border-blue-600 bg-blue-600 font-bold text-white" : "border-slate-200 bg-white text-slate-700"}`}
                    >
                      {number}
                    </button>
                  ),
                )}
                <button
                  aria-label="หน้าถัดไป"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5"
                >
                  →
                </button>
              </div>
            </nav>
          </section>
        </div>
      </div>
    </main>
  );
}
