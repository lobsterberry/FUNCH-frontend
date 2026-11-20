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
};

export type BookingSummary = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
  totalPrice: string;
  currencyCode: string;
  timeZone: string;
  carSnapshot: Record<string, unknown> | null;
  car: { brand: string; model: string };
  pickupLocation: BookingLocation | null;
  dropoffLocation: BookingLocation | null;
};

export function bookingSnapshot(
  booking: Pick<BookingSummary, "carSnapshot">,
  key: string,
  fallback = "—",
): string {
  const value = booking.carSnapshot?.[key];
  return typeof value === "string" && value ? value : fallback;
}

export const bookingCarName = (booking: Pick<BookingSummary, "carSnapshot" | "car">) =>
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
  booking: Pick<BookingSummary, "carSnapshot" | "pickupLocation" | "dropoffLocation" | "timeZone">,
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
