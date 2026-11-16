"use client";

import Link from "next/link";
import { useState } from "react";
import { cars, countries, defaultCriteria, type Car } from "@/lib/rental";
import { CarCard } from "./car-card";
import { SearchForm } from "./search-form";

export function HomeContent({
  onDetails,
  onBook,
}: {
  onDetails: (car: Car) => void;
  onBook: (car: Car) => void;
}) {
  const [category, setCategory] = useState("all");
  const categories = [
    { id: "all", label: "ทั้งหมด" },
    { id: "SUV", label: "SUV / Crossover" },
    { id: "Sedan", label: "Sedan" },
    { id: "EV", label: "EV 100% (ไฟฟ้า)" },
    { id: "MPV", label: "MPV / รถตู้ 7 ที่นั่ง" },
  ];
  const featured = cars.filter(
    (car) =>
      car.featured &&
      (category === "all" ||
        car.category === category ||
        car.fuel === category),
  );
  return (
    <main id="main-content">
      <section className="relative overflow-hidden bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 px-4 pt-16 pb-40 text-white sm:px-6 lg:px-8">
        <div className="hero-pattern pointer-events-none absolute inset-0 opacity-10" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-0 -left-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl space-y-4 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-blue-900/60 px-3 py-1 text-xs font-medium text-blue-300">
            <span>🌍 บริการเช่ารถยนต์ครอบคลุมทั่วโลก</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>คำนวณราคาโปร่งใสตามเวลาจริง</span>
          </div>
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-white sm:text-5xl">
            เช่ารถขับเที่ยวทั่วโลก{" "}
            <span className="bg-linear-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              ง่าย ปลอดภัย
            </span>{" "}
            สบายใจทุกทริป
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
            เลือกรถคุณภาพดีในประเทศที่คุณต้องการเดินทาง คิดค่าเช่าตามเวลาจริง
            ทั้งแบบรายชั่วโมงและรายวัน พร้อมอนุมัติรวดเร็ว
          </p>
        </div>
        <div className="relative z-20 mx-auto mt-10 max-w-5xl">
          <SearchForm />
        </div>
      </section>
      <section
        id="popular-destinations"
        className="relative z-10 -mt-20 border-b border-slate-200 bg-white px-4 pt-24 pb-6 sm:-mt-16 sm:px-6 sm:pt-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                แยกค้นหาตามประเทศยอดนิยม
              </h2>
              <p className="text-xs text-slate-500">
                เลือกดูรถยนต์ที่มีพร้อมให้บริการในแต่ละประเทศ
              </p>
            </div>
            <Link
              href="/search?country=all"
              className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              ดูทุกประเทศ →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {countries.map((country, index) => (
              <Link
                href={`/search?country=${country.code}`}
                key={country.code}
                className={`group flex items-center rounded-xl border p-3 transition hover:border-blue-300 hover:bg-blue-50/50 ${index === 0 ? "border-blue-200 bg-blue-50/50" : "border-slate-200"}`}
              >
                <span className="mr-2.5 text-2xl">{country.flag}</span>
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600">
                    {country.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {cars.filter((car) => car.country === country.code).length}{" "}
                    คันตัวอย่าง
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wider text-blue-600">
              ⭐ TOP RATED FLEET
            </p>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              รถแนะนำยอดนิยมสำหรับคุณ
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              คัดสรรรถคุณภาพสูงที่ได้รับความนิยม พร้อมอัตราค่าบริการรายวันและรายชั่วโมงโปร่งใส
            </p>
          </div>
          <div
            className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 text-xs"
            aria-label="ประเภทรถแนะนำ"
          >
            {categories.map((item) => (
              <button
                key={item.id}
                onClick={() => setCategory(item.id)}
                aria-pressed={category === item.id}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 font-medium transition ${category === item.id ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-300 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-600"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              criteria={defaultCriteria}
              onDetails={onDetails}
              onBook={onBook}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/search?country=all"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-blue-600"
          >
            ดูรถทั้งหมดและตัวกรองเพิ่มเติม <span>→</span>
          </Link>
        </div>
      </section>
      <PricingRules />
    </main>
  );
}

function PricingRules() {
  const rules = [
    {
      title: "รายชั่วโมง vs รายวัน",
      text: "อัตราค่าบริการแบ่งเป็นรายชั่วโมงและรายวัน ให้ความยืดหยุ่นสำหรับทริปสั้นหรือการเดินทางระยะยาว",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "เกิน 8 ชั่วโมง = 1 วัน",
      text: "หากระยะเวลาเช่าคำนวณแล้วเกิน 8 ชั่วโมง ระบบจะปัดเป็นอัตราค่าบริการ 1 วันโดยอัตโนมัติ",
      color: "bg-amber-100 text-amber-700",
    },
    {
      title: "คืนหลัง 14:00 น. = 1 วันเต็ม",
      text: "หากเวลาส่งคืนเกิน 14:00 น. จะนับเศษเวลาวันนั้นเท่ากับ 1 วัน เช่น รับ 10:00 คืน 12:00 = 2 ชม. แต่ถ้าคืน 15:00 น. จะคิดเป็น 1 วันเต็ม",
      color: "bg-rose-100 text-rose-600",
    },
  ];
  return (
    <section
      id="pricing-rules-info"
      className="border-t border-slate-200 bg-slate-100 px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <span className="text-xs font-bold tracking-wider text-blue-600">
            PRICING RULES
          </span>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            กฎการคิดคำนวณอัตราค่าบริการ (Pricing Rules)
          </h2>
          <p className="text-sm text-slate-500">
            ระบบคำนวณราคาอัตโนมัติอย่างโปร่งใสตามข้อกำหนดในเงื่อนไขการเช่า
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {rules.map((rule, index) => (
            <div
              key={rule.title}
              className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm ${index === 1 ? "border-blue-200 ring-1 ring-blue-500/20" : "border-slate-200"}`}
            >
              <span
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${rule.color}`}
              >
                {index + 1}
              </span>
              <h3 className="mb-1 text-base font-bold text-slate-900">
                {rule.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                {rule.text}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <span className="text-lg">📌</span>
          <p>
            <strong>การนับรอบชั่วโมงต่อเนื่องข้ามวัน: </strong>เมื่อใช้งานเกิน 8
            ชั่วโมงและนับเป็น 1 วันแล้ว ระบบจะเริ่มนับรายชั่วโมงอีกครั้งเมื่อถึงเวลารับรถของอีกวัน
            เช่น รับรถ 10:00 น. คืน 11:00 น. ของอีกวัน ค่าบริการจะเท่ากับ 1 วัน + 1 ชั่วโมง
          </p>
        </div>
      </div>
    </section>
  );
}
