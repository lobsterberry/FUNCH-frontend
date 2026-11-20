import { ApiError } from './account';

export type AdminMember = {
  id: string; name: string; email: string; phoneNumber: string | null;
  firstName: string | null; lastName: string | null; role: 'USER' | 'ADMIN';
  isActive: boolean; createdAt: string; updatedAt: string; bookingCount: number; totalSpend: string;
};
export type MemberInput = Pick<AdminMember, 'name' | 'email' | 'phoneNumber' | 'role' | 'isActive'> & { password?: string };
export type Pagination = { page: number; pageSize: number; total: number; totalPages: number };
export type MemberList = {
  success: true; data: AdminMember[]; pagination: Pagination;
  summary: { total: number; active: number; suspended: number; admins: number }
};
export type MemberBooking = {
  id: string; bookingNumber: string; startDateTime: string; endDateTime: string;
  totalPrice: string; currencyCode: string; timeZone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  source: 'EXISTING_MEMBER' | 'REGISTER_AND_BOOK'; driverName: string | null;
  internationalDrivingPermit: string | null; carSnapshot: Record<string, unknown> | null;
  car: { brand: string; model: string; licensePlate: string };
  pickupLocation: { name: string; nameTh: string } | null;
  dropoffLocation: { name: string; nameTh: string } | null;
};
export type MemberDetails = AdminMember & { bookings: MemberBooking[]; pagination: Pagination };

export async function memberRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/members${path}`, {
      method, cache: 'no-store', credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch { throw new ApiError('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง', 0); }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const messages: Record<number, string> = {
      400: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแบบฟอร์ม',
      401: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 403: 'บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ',
      404: 'ไม่พบสมาชิก กรุณาโหลดข้อมูลใหม่', 429: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่'
    };
    throw new ApiError(messages[response.status] || result?.message || 'ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง', response.status);
  }
  return result as T;
}

export const memberMoney = (value: string | number, currency = 'THB') =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value));
export const memberDate = (value: string) => new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium', timeZone: 'Asia/Bangkok',
}).format(new Date(value));

export function membersCsv(members: AdminMember[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [
    ['ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'สิทธิ์', 'สถานะ', 'วันที่สมัคร', 'จำนวนการจอง', 'ยอดอนุมัติ/สำเร็จ (THB)'],
    ...members.map((member) => [member.name, member.email, member.phoneNumber, member.role,
    member.isActive ? 'เปิดใช้งาน' : 'ระงับบัญชี', memberDate(member.createdAt), member.bookingCount, member.totalSpend]),
  ].map((row) => row.map(cell).join(',')).join('\r\n');
}
