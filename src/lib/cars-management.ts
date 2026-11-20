import { ApiError } from "./account";
import type { Car } from "./rental";

export const carCategories = ["SUV", "SEDAN", "MPV", "EV", "ECO", "LUXURY", "WAGON"] as const;
export type CarCategory = typeof carCategories[number];
export const featureOptions = {
  GPS_EN: "ระบบนำทาง GPS รองรับภาษาอังกฤษ",
  CARPLAY_ANDROID_AUTO: "Apple CarPlay / Android Auto",
  CAMERA_360: "กล้องมองรอบทิศทาง 360°",
  ETC_CARD: "บัตรทางด่วน ETC ฟรี",
  ETC_READER: "เครื่องอ่านบัตรทางด่วน ETC",
  BASIC_INSURANCE: "รวมประกันภัยพื้นฐาน",
  ZERO_EXCESS_INSURANCE: "ประกันชั้น 1 ไม่มีค่าเสียหายส่วนแรก",
  CHILD_SEAT: "เบาะเด็กฟรี",
};
export type AdminCar = Car & {
  brand: string; rawModel: string; year: number; categories: CarCategory[];
  transmissionType: "AUTOMATIC" | "MANUAL";
  featureCodes: string[];
  options: { code: string; label: string; included: boolean }[] | null;
  rentalStatus: "IDLE" | "IN_USE" | "RESERVED";
};
export type CarInput = {
  brand: string; model: string; year: number; licensePlate: string; country: string;
  hourlyRate: number; dailyRate: number; seats: number; luggageCapacity: number;
  transmission: string; transmissionType: "AUTOMATIC" | "MANUAL";
  fuelType: string; steeringSide: "RHD" | "LHD"; locationId: string | null;
  categories: string[]; categoryLabel: string; providerName: string; isAvailable: boolean;
  featureCodes: string[]; options: { code: string; label: string; included: boolean }[];
};
export type CarFilters = { search: string; country: string; status: string; steering: string; category: string };
export const defaultCarFilters: CarFilters = { search: "", country: "all", status: "all", steering: "all", category: "all" };

export function filterAdminCars(cars: AdminCar[], filters: CarFilters) {
  const term = filters.search.trim().toLocaleLowerCase();
  return cars.filter((car) =>
    (!term || [car.name, car.licensePlate, car.provider].join(" ").toLocaleLowerCase().includes(term)) &&
    (filters.country === "all" || car.country === filters.country) &&
    (filters.steering === "all" || car.steering === filters.steering) &&
    (filters.category === "all" || car.categories.includes(filters.category as CarCategory)) &&
    (filters.status === "all" || (filters.status === "available" && car.isAvailable && car.rentalStatus === "IDLE") ||
      (filters.status === "maintenance" && !car.isAvailable) ||
      (filters.status === "booked" && car.rentalStatus !== "IDLE"))
  );
}

export function carsCsv(cars: AdminCar[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? "");
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [
    ["ยี่ห้อ", "รุ่น", "ปี", "ทะเบียน", "ประเทศ", "จุดรับรถ", "ประเภท", "พวงมาลัย", "รายชั่วโมง (THB)", "รายวัน (THB)", "เปิดให้บริการ", "การจอง"],
    ...cars.map((car) => [car.brand, car.rawModel, car.year, car.licensePlate, car.country, car.location?.nameTh, car.categories.join(" / "), car.steering === "right" ? "RHD" : "LHD", car.hour, car.day, car.isAvailable ? "พร้อมบริการ" : "ซ่อมบำรุง", car.rentalStatus]),
  ].map((row) => row.map(cell).join(",")).join("\r\n");
}

export async function adminRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method, cache: "no-store", credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined,
    });
  } catch { throw new ApiError("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง", 0); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const specific: Record<string, string> = {
      "HAS_ACTIVE_BOOKINGS": "รถมีรายการจองค้าง กรุณาจัดการตารางรถก่อนเปลี่ยนรุ่น ย้ายสาขา ปิดบริการ หรือส่งซ่อม",
      "INVALID_TRANSFER": "ปลายทางต้องเปิดบริการสำหรับรุ่นและผู้ให้บริการเดียวกัน ภายในประเทศเดียวกัน",
      "OFFER_IDENTITY": "กรุณาสร้างข้อเสนอใหม่เมื่อต้องการเปลี่ยนรุ่น สาขา หรือผู้ให้บริการ",
      "SCHEDULE_CONFLICT": "การเปลี่ยนแปลงกระทบตารางรถหรือสถานที่รับรถของรายการจองอื่น",
      "INVALID_TRANSITION": "ไม่สามารถเปลี่ยนสถานะการจองตามที่เลือกได้",
      "A record with these details already exists": "ทะเบียนรถนี้มีอยู่ในประเทศที่เลือกแล้ว",
      "Country and pickup location must match": "กรุณาเลือกจุดรับรถให้ตรงกับประเทศ",
      "Car has upcoming bookings; location cannot change": "รถมีรายการจองอยู่ จึงยังเปลี่ยนประเทศหรือจุดรับรถไม่ได้",
    };
    const messages: Record<number, string> = { 400: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแบบฟอร์ม", 401: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง", 403: "บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ", 404: "ไม่พบข้อมูลรถยนต์ กรุณาโหลดข้อมูลใหม่", 409: "ข้อมูลซ้ำ กรุณาตรวจสอบทะเบียนรถ", 429: "ทำรายการบ่อยเกินไป กรุณารอสักครู่" };
    throw new ApiError(specific[data?.message] || messages[response.status] || "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง", response.status);
  }
  return data as T;
}
