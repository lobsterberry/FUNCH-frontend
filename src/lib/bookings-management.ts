import { ApiError } from "./account";

export const bookingStatuses = [
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;
export type BookingStatus = (typeof bookingStatuses)[number];
export const bookingLabels: Record<BookingStatus, string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  COMPLETED: "เสร็จสิ้น",
  REJECTED: "ปฏิเสธ",
  CANCELLED: "ยกเลิก",
};
export const bookingColors: Record<BookingStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  APPROVED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-rose-50 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};
type BookingLocation = {
  name: string;
  nameTh: string;
  timeZone: string;
  countryCode: string;
};
export type AdminBooking = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  adminNote: string | null;
  calculatedDays: number;
  calculatedHours: number;
  totalPrice: string;
  currencyCode: string;
  hourlyRate: string | null;
  dailyRate: string | null;
  timeZone: string;
  turnaroundMinutes: number;
  pricingDetails: { breakdown?: string } | null;
  carSnapshot: Record<string, unknown> | null;
  source: "EXISTING_MEMBER" | "REGISTER_AND_BOOK";
  driverName: string | null;
  internationalDrivingPermit: string | null;
  user: { id: string; name: string; email: string; phoneNumber: string | null };
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    country: string;
    providerName: string | null;
  };
  pickupLocation: BookingLocation | null;
  dropoffLocation: BookingLocation | null;
  approvedBy: { id: string; name: string; email: string } | null;
};
export type BookingList = {
  success: true;
  data: AdminBooking[];
  count: number;
  summary: Record<BookingStatus, number>;
  countries: { code: string; name: string; nameTh: string; flag: string }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
export type ReviewAction = "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export async function bookingRequest<T>(
  path = "",
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/bookings${path}`, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง", 0);
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const specific: Record<string, string> = {
      BOOKING_CHANGED:
        "รายการนี้ถูกแก้ไขแล้ว กรุณาปิดหน้าต่างและรีเฟรชข้อมูลก่อนพิจารณาอีกครั้ง",
      SCHEDULE_CONFLICT:
        "ตารางรถหรือสถานะรถไม่พร้อมสำหรับรายการนี้ กรุณาตรวจสอบตารางรถและรีเฟรชข้อมูล",
      INVALID_TRANSITION:
        "ไม่สามารถเปลี่ยนเป็นสถานะนี้ได้ กรุณาตรวจสอบสถานะและกำหนดคืนรถอีกครั้ง",
    };
    const messages: Record<number, string> = {
      400: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      401: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
      403: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ",
      404: "ไม่พบรายการจอง กรุณาโหลดข้อมูลใหม่",
      409: "ข้อมูลมีการเปลี่ยนแปลง กรุณารีเฟรชข้อมูล",
      429: "ทำรายการบ่อยเกินไป กรุณารอสักครู่",
    };
    throw new ApiError(
      specific[result?.message] ||
        messages[response.status] ||
        "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง",
      response.status,
    );
  }
  return result as T;
}

export function bookingSnapshot(
  booking: AdminBooking,
  key: string,
  fallback = "—",
): string {
  const value = booking.carSnapshot?.[key];
  return typeof value === "string" && value ? value : fallback;
}
export const bookingCarName = (booking: AdminBooking) =>
  `${bookingSnapshot(booking, "brand", booking.car.brand)} ${bookingSnapshot(booking, "model", booking.car.model)}`;
export const bookingMoney = (value: string | number, currency = "THB") =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
export const bookingDate = (value: string, timeZone = "Asia/Bangkok") =>
  new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
export function bookingBranch(
  booking: AdminBooking,
  kind: "pickup" | "dropoff",
) {
  const location =
    kind === "pickup" ? booking.pickupLocation : booking.dropoffLocation;
  return {
    name: bookingSnapshot(
      booking,
      `${kind}LocationName`,
      location?.nameTh || location?.name,
    ),
    timeZone: bookingSnapshot(
      booking,
      `${kind}TimeZone`,
      location?.timeZone || booking.timeZone,
    ),
  };
}
