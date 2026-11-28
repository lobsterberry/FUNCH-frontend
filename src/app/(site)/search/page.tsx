import { Suspense } from "react";
import type { Metadata } from "next";
import SearchRental from "@/components/site/search-page";

export const metadata: Metadata = {
  title: "ค้นหารถยนต์ | FUNCH Drive",
  description: "ค้นหาและเปรียบเทียบรถเช่า พร้อมตัวกรองประเทศ ประเภทรถ และอัตราค่าบริการ",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SearchRental />
    </Suspense>
  );
}
