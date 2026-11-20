"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  memberDate,
  memberMoney,
  memberRequest,
  type MemberBooking,
  type MemberDetails as Details,
} from "@/lib/members-management";
import { Dialog } from "@/components/shared/dialog";

const statusLabels: Record<MemberBooking["status"], string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};
const statusColors: Record<MemberBooking["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
  COMPLETED: "bg-emerald-50 text-emerald-700",
};
function bookingDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function MemberDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await memberRequest<{ data: Details }>(
        `/${encodeURIComponent(id)}?page=${page}`,
      );
      if (current === requestId.current) setData(result.data);
    } catch (cause) {
      if (current === requestId.current) setError((cause as Error).message);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [id, page]);
  useEffect(() => {
    const requests = requestId;
    const timer = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(timer);
      requests.current++;
    };
  }, [load]);
  return (
    <Dialog title="รายละเอียดสมาชิกและประวัติการจอง" onClose={onClose} wide>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button onClick={() => void load()} className="ml-3 underline">
            ลองอีกครั้ง
          </button>
        </div>
      )}
      {loading && (
        <p role="status" className="py-6 text-center text-sm text-slate-500">
          กำลังโหลดข้อมูลสมาชิก…
        </p>
      )}
      {data && !loading && !error && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{data.name}</h3>
              <p className="mt-1 break-all text-sm text-slate-500">
                {data.email}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${data.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
            >
              {data.isActive ? "เปิดใช้งาน" : "ระงับบัญชี"}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">เบอร์โทรศัพท์</dt>
              <dd className="mt-2 break-words font-medium">
                {data.phoneNumber || "ไม่ระบุ"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">สิทธิ์การใช้งาน</dt>
              <dd className="mt-2 font-medium">{data.role}</dd>
            </div>
            <div>
              <dt className="text-slate-500">วันที่สมัคร</dt>
              <dd className="mt-2 font-medium">{memberDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ยอดอนุมัติ/สำเร็จ</dt>
              <dd className="mt-2 font-semibold text-emerald-700">
                {memberMoney(data.totalSpend)}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="font-semibold">
              ประวัติการจอง{" "}
              <span className="ml-2 text-sm font-normal text-slate-500">
                {data.bookingCount.toLocaleString("th-TH")} รายการ
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              วันเวลาตามเขตเวลาของจุดรับรถ •
              ยอดรวมเฉพาะรายการที่อนุมัติหรือเสร็จสิ้น
            </p>
          </div>
          {data.bookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              สมาชิกนี้ยังไม่มีประวัติการจอง
            </p>
          ) : (
            <div className="space-y-3">
              {data.bookings.map((booking) => {
                const snapshot = booking.carSnapshot;
                const brand =
                  typeof snapshot?.brand === "string"
                    ? snapshot.brand
                    : booking.car.brand;
                const model =
                  typeof snapshot?.model === "string"
                    ? snapshot.model
                    : booking.car.model;
                const plate =
                  typeof snapshot?.licensePlate === "string"
                    ? snapshot.licensePlate
                    : booking.car.licensePlate;
                return (
                  <article
                    key={booking.id}
                    className="rounded-xl border border-slate-200 p-4 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-all font-mono text-slate-500">
                        {booking.bookingNumber}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 ${statusColors[booking.status]}`}
                      >
                        {statusLabels[booking.status]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-2">
                      <h4 className="text-sm font-semibold">
                        {brand} {model}{" "}
                        <span className="ml-1 font-normal text-slate-500">
                          {plate}
                        </span>
                      </h4>
                      <strong className="text-sm">
                        {memberMoney(booking.totalPrice, booking.currencyCode)}
                      </strong>
                    </div>
                    <p className="mt-2 leading-6 text-slate-600">
                      {bookingDate(booking.startDateTime, booking.timeZone)} →{" "}
                      {bookingDate(booking.endDateTime, booking.timeZone)}{" "}
                      <span className="text-slate-400">
                        ({booking.timeZone})
                      </span>
                    </p>
                    <p className="mt-1 leading-6 text-slate-500">
                      รับรถ:{" "}
                      {booking.pickupLocation?.nameTh ||
                        booking.pickupLocation?.name ||
                        "ไม่ระบุ"}{" "}
                      · คืนรถ:{" "}
                      {booking.dropoffLocation?.nameTh ||
                        booking.dropoffLocation?.name ||
                        "ไม่ระบุ"}
                    </p>
                    <p className="mt-1 leading-6 text-slate-500">
                      ผู้ขับขี่: {booking.driverName || "ไม่ระบุ"} ·
                      ใบขับขี่สากล:{" "}
                      {booking.internationalDrivingPermit || "ไม่ระบุ"}
                    </p>
                    <p className="mt-2 text-[11px] text-blue-600">
                      {booking.source === "REGISTER_AND_BOOK"
                        ? "สมัครสมาชิกพร้อมจอง"
                        : "จองโดยสมาชิกเดิม"}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs">
              <button
                disabled={data.pagination.page <= 1}
                onClick={() => setPage(data.pagination.page - 1)}
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                ก่อนหน้า
              </button>
              <span>
                หน้า {data.pagination.page} / {data.pagination.totalPages}
              </span>
              <button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => setPage(data.pagination.page + 1)}
                className="rounded-lg border px-3 py-2 disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <button
          onClick={onClose}
          className="rounded-xl border border-slate-300 px-5 py-2 text-xs hover:bg-slate-50"
        >
          ปิด
        </button>
      </div>
    </Dialog>
  );
}
