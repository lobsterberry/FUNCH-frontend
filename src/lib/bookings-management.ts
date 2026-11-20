import { ApiError } from "./account";
import type { BookingStatus } from "./booking-display";

export {
  bookingStatuses,
  bookingLabels,
  bookingColors,
  bookingSnapshot,
  bookingCarName,
  bookingMoney,
  bookingDate,
  bookingBranch,
  type BookingStatus,
} from "./booking-display";

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
