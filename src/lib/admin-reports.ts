export type ReportStatus =
  | "PENDING"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";
export type ReportFilters = {
  start: string;
  end: string;
  basis: string;
  comparison: string;
  country: string;
  category: string;
  currency: string;
};
export type ReportCountry = { code: string; nameTh: string; flag: string };
export type ReportSummary = {
  total: number;
  confirmedCount: number;
  approvalRate: number;
  statuses: Record<ReportStatus, number>;
  currencies: {
    currency: string;
    total: string;
    approved: string;
    completed: string;
    pending: string;
    excluded: string;
    confirmed: string;
    average: string;
  }[];
};
export type BookingReport = {
  summary: ReportSummary;
  comparison: { start: string; end: string; summary: ReportSummary } | null;
  interval: "day" | "month";
  trend: { date: string; bookings: number; amounts: Record<string, string> }[];
  countries: (ReportCountry & {
    count: number;
    amounts: Record<string, string>;
  })[];
  topCars: {
    carId: string;
    name: string;
    licensePlate: string;
    currency: string;
    count: number;
    amount: string;
  }[];
  sources: { EXISTING_MEMBER: number; REGISTER_AND_BOOK: number };
  pricing: { daily: number; hourlyOnly: number };
  bookings: {
    id: string;
    bookingNumber: string;
    createdAt: string;
    startDateTime: string;
    endDateTime: string;
    carId: string;
    carName: string;
    licensePlate: string;
    country: ReportCountry;
    pickup: string;
    status: ReportStatus;
    source: string;
    currency: string;
    amount: string;
    timeZone: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: ReportFilters;
  timeZone: string;
  generatedAt: string;
  options: { countries: ReportCountry[]; currencies: string[] };
};
export const reportStatuses: Record<
  ReportStatus,
  { label: string; color: string; dot: string }
> = {
  PENDING: {
    label: "รออนุมัติ",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    color: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    color: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    color: "bg-rose-50 text-rose-700",
    dot: "bg-rose-400",
  },
};
export const reportNumber = (value: number) =>
  new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(value);
export function reportMoney(value: string | number, currency: string) {
  return (
    new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value)) + ` ${currency}`
  );
}
export function dateLabel(day: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`));
}
export function dateTimeLabel(value: string, timeZone = "Asia/Bangkok") {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}
export function shiftReportDay(day: string, offset: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
export function presetRange(preset: string, today: string) {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  if (preset === "today") return { start: today, end: today };
  if (preset === "month")
    return { start: `${today.slice(0, 7)}-01`, end: today };
  if (preset === "lastMonth") {
    const end = shiftReportDay(`${today.slice(0, 7)}-01`, -1);
    return { start: `${end.slice(0, 7)}-01`, end };
  }
  if (preset === "quarter")
    return {
      start: `${year}-${String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, "0")}-01`,
      end: today,
    };
  if (preset === "year") return { start: `${year}-01-01`, end: today };
  return {
    start: shiftReportDay(today, preset === "7d" ? -6 : -29),
    end: today,
  };
}
export function reportGrowth(current: number, previous: number | undefined) {
  if (previous === undefined) return null;
  if (previous === 0) return current === 0 ? "0%" : "ไม่มีฐานเปรียบเทียบ";
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? "+" : ""}${reportNumber(change)}%`;
}
