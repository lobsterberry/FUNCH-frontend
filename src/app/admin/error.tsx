"use client";

export default function ErrorPage() {
  return <main className="m-auto max-w-md p-8 text-center"><h1 className="text-xl font-bold">เชื่อมต่อระบบหลังบ้านไม่สำเร็จ</h1><p className="my-4 text-sm text-slate-500">กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง</p><button className="btn-primary px-5 py-2" onClick={() => window.location.reload()}>ลองอีกครั้ง</button></main>;
}
