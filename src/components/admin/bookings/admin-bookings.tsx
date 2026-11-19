"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/account";
import {
  bookingBranch,
  bookingCarName,
  bookingColors,
  bookingDate,
  bookingLabels,
  bookingMoney,
  bookingRequest,
  bookingSnapshot,
  bookingStatuses,
  type AdminBooking,
  type BookingList,
  type BookingStatus,
  type ReviewAction,
} from "@/lib/admin-bookings";
import { AdminIcon } from "../layout/admin-icon";
import { BookingReview } from "./booking-review";

const descriptions: Record<BookingStatus, string> = {
  PENDING: "คำขอที่ต้องพิจารณา",
  APPROVED: "พร้อมส่งมอบตามกำหนด",
  COMPLETED: "รับรถคืนเรียบร้อย",
  REJECTED: "คำขอที่ไม่ผ่านการพิจารณา",
  CANCELLED: "การจองที่ยกเลิกแล้ว",
};

export function AdminBookings() {
  const router = useRouter();
  const params = useSearchParams();
  const search = (params.get("search") || "").slice(0, 254);
  const status =
    params.get("status") === "all"
      ? "all"
      : bookingStatuses.includes(params.get("status") as BookingStatus)
        ? (params.get("status") as BookingStatus)
        : "PENDING";
  const country = /^[A-Z]{2}$/.test(params.get("country") || "")
    ? params.get("country")!
    : "all";
  const sort = ["newest", "pickup", "value"].includes(params.get("sort") || "")
    ? params.get("sort")!
    : "newest";
  const rawPage = Number(params.get("page"));
  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 1_000_000
      ? rawPage
      : 1;
  const query = new URLSearchParams({
    search,
    status,
    country,
    sort,
    page: String(page),
  }).toString();
  const [data, setData] = useState<BookingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<{
    booking: AdminBooking;
    action?: ReviewAction;
  } | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await bookingRequest<BookingList>(`?${query}`);
      if (current === requestId.current) setData(result);
    } catch (cause) {
      if (current !== requestId.current) return;
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
        router.replace("/admin/login");
        router.refresh();
      }
      setError((cause as Error).message);
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [query, router]);

  useEffect(() => {
    const requests = requestId;
    const timer = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(timer);
      requests.current++;
    };
  }, [load]);

  function navigate(changes: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(changes)) next.set(key, value);
    router.replace(`/admin/bookings?${next}`, { scroll: false });
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({
      search: String(
        new FormData(event.currentTarget).get("search") || "",
      ).trim(),
      page: "1",
    });
  }
  async function save(action: ReviewAction, note: string) {
    if (!modal) return;
    try {
      await bookingRequest(
        `/${encodeURIComponent(modal.booking.id)}/status`,
        "PATCH",
        {
          status: action,
          adminNote: note,
          expectedUpdatedAt: modal.booking.updatedAt,
        },
      );
    } catch (cause) {
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
        router.replace("/admin/login");
        router.refresh();
      }
      throw cause;
    }
    setNotice(
      `${modal.booking.bookingNumber} · บันทึกสถานะ “${bookingLabels[action]}” เรียบร้อยแล้ว`,
    );
    setModal(null);
    await load();
  }
  const summary = !error ? data?.summary : undefined;
  const total = summary
    ? bookingStatuses.reduce((sum, item) => sum + summary[item], 0)
    : undefined;
  const filtered = search || country !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              ระบบอนุมัติการจอง
            </h1>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              รออนุมัติ {summary?.PENDING ?? "—"} รายการ
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Booking Approval System ·
            ตรวจสอบคำขอและจัดการสถานะการจองรถยนต์ทั่วโลก
          </p>
        </div>
        <button
          disabled={loading}
          onClick={() => void load()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          {loading ? "กำลังโหลด…" : "รีเฟรชข้อมูล"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {bookingStatuses.map((item) => (
          <button
            key={item}
            onClick={() => navigate({ status: item, page: "1" })}
            aria-pressed={status === item}
            className={`rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-md ${status === item ? (item === "PENDING" ? "border-amber-300 bg-amber-50 ring-1 ring-amber-300" : "border-blue-300 bg-white ring-1 ring-blue-300") : "border-slate-200 bg-white"}`}
          >
            <span
              className={`inline-flex rounded-lg p-2 ${bookingColors[item]}`}
            >
              <AdminIcon
                name={
                  item === "PENDING"
                    ? "booking"
                    : item === "APPROVED" || item === "COMPLETED"
                      ? "check"
                      : "report"
                }
                className="h-4 w-4"
              />
            </span>
            <p className="mt-3 text-xs text-slate-600">
              {bookingLabels[item]}{" "}
              <span className="text-[10px] text-slate-400">{item}</span>
            </p>
            <p
              className={`mt-1 text-2xl font-bold ${item === "PENDING" ? "text-amber-800" : item === "APPROVED" ? "text-emerald-700" : "text-slate-900"}`}
            >
              {summary?.[item]?.toLocaleString("th-TH") ?? "—"}{" "}
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {descriptions[item]}
            </p>
          </button>
        ))}
      </div>
      {notice && (
        <p
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span className="break-all">{notice}</span>
          <button
            aria-label="ปิดข้อความแจ้งเตือน"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
          <button onClick={() => void load()} className="ml-3 underline">
            ลองอีกครั้ง
          </button>
        </div>
      )}
      <section
        aria-label="รายการจองรถยนต์"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          className="flex flex-wrap gap-2 border-b border-slate-200 p-4 sm:px-5"
          aria-label="กรองสถานะการจอง"
        >
          {(["all", ...bookingStatuses] as const).map((item) => (
            <button
              key={item}
              onClick={() => navigate({ status: item, page: "1" })}
              aria-pressed={status === item}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${status === item ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {item === "all" ? "ทั้งหมด" : bookingLabels[item]}{" "}
              <span
                className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] ${status === item ? "bg-white/15" : "bg-slate-100"}`}
              >
                {item === "all" ? (total ?? "—") : (summary?.[item] ?? "—")}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4 sm:p-5">
          <form
            onSubmit={filter}
            className="flex w-full min-w-0 items-end gap-2 lg:w-auto lg:flex-1"
          >
            <label className="min-w-0 flex-1 text-xs font-medium text-slate-600">
              ค้นหาการจอง
              <input
                key={search}
                name="search"
                type="search"
                maxLength={254}
                defaultValue={search}
                placeholder="เลขที่จอง ชื่อ อีเมล เบอร์โทร หรือทะเบียนรถ"
                className="form-input mt-2"
              />
            </label>
            <button
              aria-label="ค้นหาการจอง"
              className="flex h-[42px] items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs text-white hover:bg-slate-800"
            >
              <AdminIcon name="search" className="h-4 w-4" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>
          </form>
          <label className="min-w-32 flex-1 text-xs font-medium text-slate-600 sm:flex-none">
            ประเทศ
            <select
              value={country}
              onChange={(event) =>
                navigate({ country: event.target.value, page: "1" })
              }
              className="form-input mt-2"
            >
              <option value="all">ทุกประเทศ</option>
              {country !== "all" &&
                !data?.countries.some((item) => item.code === country) && (
                  <option value={country}>{country}</option>
                )}
              {data?.countries.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.flag} {item.nameTh || item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-36 flex-1 text-xs font-medium text-slate-600 sm:flex-none">
            เรียงตาม
            <select
              value={sort}
              onChange={(event) =>
                navigate({ sort: event.target.value, page: "1" })
              }
              className="form-input mt-2"
            >
              <option value="newest">วันที่จองล่าสุด</option>
              <option value="pickup">วันรับรถเร็วที่สุด</option>
              <option value="value">ยอดรวมสูงสุด</option>
            </select>
          </label>
          {filtered && (
            <button
              onClick={() =>
                navigate({ search: "", country: "all", page: "1" })
              }
              className="py-3 text-xs text-blue-600 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {status === "PENDING"
              ? "คิวคำขอที่รอการพิจารณา"
              : status === "all"
                ? "รายการจองทั้งหมด"
                : `รายการ${bookingLabels[status]}`}
          </h2>
          <p className="mt-1 text-[11px] leading-6 text-slate-500">
            วันเวลารับ–คืนแสดงตามเขตเวลาของแต่ละสาขา ·
            ยอดรวมใช้สกุลเงินที่บันทึกไว้ในการจอง
          </p>
        </div>
        <div className="overflow-x-auto" aria-busy={loading}>
          <p className="px-5 py-2 text-[10px] text-slate-500 xl:hidden">
            เลื่อนตารางแนวนอนเพื่อดูข้อมูลทั้งหมด
            หรือกดเลขที่จองเพื่อเปิดรายละเอียด
          </p>
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500">
              <tr>
                {[
                  "เลขที่จอง / ผู้เช่า",
                  "รถยนต์ / สาขา",
                  "วันเวลารับ–คืน (ท้องถิ่น)",
                  "ราคา / ระยะเวลาที่คิด",
                  "ยอดรวม",
                  "สถานะ",
                  "ดำเนินการ",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="whitespace-nowrap px-4 py-4 font-medium"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <span role="status">กำลังโหลดรายการจอง…</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    ไม่สามารถแสดงรายการจองได้ กรุณาลองอีกครั้ง
                  </td>
                </tr>
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <AdminIcon
                      name="booking"
                      className="mx-auto mb-3 h-8 w-8 text-slate-300"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      {filtered
                        ? "ไม่พบการจองที่ตรงกับตัวกรอง"
                        : status === "PENDING"
                          ? "ไม่มีคำขอที่รออนุมัติ"
                          : "ยังไม่มีรายการจองในสถานะนี้"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {filtered
                        ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"
                        : "เลือกสถานะทั้งหมดเพื่อดูประวัติการจอง"}
                    </p>
                  </td>
                </tr>
              ) : (
                data.data.map((booking) => {
                  const pickup = bookingBranch(booking, "pickup");
                  const dropoff = bookingBranch(booking, "dropoff");
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/70">
                      <td className="max-w-60 px-4 py-5 align-top">
                        <button
                          onClick={() => setModal({ booking })}
                          className="break-all text-left text-xs font-semibold text-blue-700 hover:underline"
                        >
                          {booking.bookingNumber}
                        </button>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {booking.user.name}
                        </p>
                        <p className="mt-1 break-all text-[11px] text-slate-500">
                          {booking.user.email}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {booking.source === "REGISTER_AND_BOOK"
                            ? "สมัครพร้อมจอง"
                            : "สมาชิกเดิม"}
                        </p>
                      </td>
                      <td className="max-w-52 px-4 py-5 align-top">
                        <p className="font-semibold text-slate-800">
                          {bookingCarName(booking)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {bookingSnapshot(
                            booking,
                            "licensePlate",
                            booking.car.licensePlate,
                          )}{" "}
                          · {booking.car.country}
                        </p>
                        <p className="mt-2 text-[11px] text-slate-600">
                          รับ: {pickup.name}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          คืน: {dropoff.name}
                        </p>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <p className="whitespace-nowrap text-slate-700">
                          รับ{" "}
                          {bookingDate(booking.startDateTime, pickup.timeZone)}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {pickup.timeZone}
                        </p>
                        <p className="mt-2 whitespace-nowrap text-slate-700">
                          คืน{" "}
                          {bookingDate(booking.endDateTime, dropoff.timeZone)}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {dropoff.timeZone}
                        </p>
                      </td>
                      <td className="px-4 py-5 align-top">
                        <p className="whitespace-nowrap font-medium text-slate-700">
                          {booking.calculatedDays} วัน +{" "}
                          {booking.calculatedHours} ชม.
                        </p>
                        {booking.dailyRate !== null && (
                          <p className="mt-2 whitespace-nowrap text-[10px] text-slate-500">
                            วันละ{" "}
                            {bookingMoney(
                              booking.dailyRate,
                              booking.currencyCode,
                            )}
                          </p>
                        )}
                        {booking.hourlyRate !== null && (
                          <p className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                            ชม.ละ{" "}
                            {bookingMoney(
                              booking.hourlyRate,
                              booking.currencyCode,
                            )}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 align-top">
                        <p className="text-sm font-bold text-slate-900">
                          {bookingMoney(
                            booking.totalPrice,
                            booking.currencyCode,
                          )}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {booking.currencyCode}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-5 align-top">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-medium ${bookingColors[booking.status]}`}
                        >
                          ● {bookingLabels[booking.status]}
                        </span>
                        {booking.approvedBy && (
                          <p
                            className="mt-2 max-w-28 truncate text-[10px] text-slate-400"
                            title={booking.approvedBy.name}
                          >
                            {booking.approvedBy.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-5 align-top">
                        <div className="flex flex-col items-start gap-2">
                          <button
                            onClick={() => setModal({ booking })}
                            className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
                          >
                            ดูรายละเอียด
                          </button>
                          {booking.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                aria-label={`อนุมัติ ${booking.bookingNumber}`}
                                onClick={() =>
                                  setModal({ booking, action: "APPROVED" })
                                }
                                className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] text-white hover:bg-emerald-700"
                              >
                                อนุมัติ
                              </button>
                              <button
                                aria-label={`ปฏิเสธ ${booking.bookingNumber}`}
                                onClick={() =>
                                  setModal({ booking, action: "REJECTED" })
                                }
                                className="whitespace-nowrap rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700 hover:bg-rose-100"
                              >
                                ปฏิเสธ
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500">
          <p>
            {data && !loading && !error
              ? `แสดง ${data.pagination.total ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0}–${Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} จาก ${data.pagination.total.toLocaleString("th-TH")} รายการ`
              : "รายการจองรถยนต์"}
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled={
                loading || !!error || !data || data.pagination.page <= 1
              }
              onClick={() =>
                navigate({ page: String((data?.pagination.page || 1) - 1) })
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-100"
            >
              ก่อนหน้า
            </button>
            <span>
              หน้า {data?.pagination.page || 1} /{" "}
              {data?.pagination.totalPages || 1}
            </span>
            <button
              disabled={
                loading ||
                !!error ||
                !data ||
                data.pagination.page >= data.pagination.totalPages
              }
              onClick={() =>
                navigate({ page: String((data?.pagination.page || 1) + 1) })
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-100"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>
      <p className="text-[11px] leading-6 text-slate-400">
        สรุปด้านบนแสดงจำนวนทั้งระบบ · การอนุมัติทำได้โดยผู้ดูแลระบบเท่านั้น
        และบันทึกผู้พิจารณาพร้อมเวลาทุกครั้ง
      </p>
      {modal && (
        <BookingReview
          key={modal.booking.id}
          booking={modal.booking}
          initialAction={modal.action}
          onClose={() => {
            setModal(null);
            void load();
          }}
          onSave={save}
        />
      )}
    </div>
  );
}
