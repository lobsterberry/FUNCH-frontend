import { Suspense } from "react";
import RentalApp from "@/components/rental-app";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <RentalApp mode="home" />
    </Suspense>
  );
}
