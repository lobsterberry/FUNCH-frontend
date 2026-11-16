import { Suspense } from "react";
import type { Metadata } from "next";
import RentalApp from "@/components/rental-app";

export const metadata: Metadata = {
  title: "ค้นหารถยนต์ | FUNCH Drive",
  description: "ค้นหาและเปรียบเทียบรถเช่า พร้อมตัวกรองประเทศ ประเภทรถ และอัตราค่าบริการ",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <RentalApp mode="search" />
    </Suspense>
  );
}
