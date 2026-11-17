"use client";

import Link from 'next/link';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '@/lib/account';
import { bookingBranch, bookingCarName, bookingColors, bookingDate, bookingLabels, bookingMoney,
  bookingSnapshot, type AdminBooking, type ReviewAction } from '@/lib/admin-bookings';
import { Dialog } from '../rental-dialog';

const actionLabels: Record<ReviewAction, string> = {
  APPROVED: 'อนุมัติการจอง', REJECTED: 'ปฏิเสธคำขอ', CANCELLED: 'ยกเลิกการจอง', COMPLETED: 'ยืนยันรับรถคืน',
};
const actionColors: Record<ReviewAction, string> = {
  APPROVED: 'bg-emerald-600 hover:bg-emerald-700', REJECTED: 'bg-rose-600 hover:bg-rose-700',
  CANCELLED: 'bg-rose-600 hover:bg-rose-700', COMPLETED: 'bg-blue-600 hover:bg-blue-700',
};
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-[11px] text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{children}</dd></div>;
}

export function BookingReview({ booking, initialAction, onClose, onSave }: {
  booking: AdminBooking; initialAction?: ReviewAction; onClose: () => void;
  onSave: (status: ReviewAction, note: string) => Promise<void>;
}) {
  const [action, setAction] = useState<ReviewAction | null>(initialAction ?? null);
  const [note, setNote] = useState(booking.adminNote || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);
  const pickup = bookingBranch(booking, 'pickup');
  const dropoff = bookingBranch(booking, 'dropoff');
  const needsReason = action === 'REJECTED' || action === 'CANCELLED';
  const actions: ReviewAction[] = booking.status === 'PENDING' ? ['APPROVED', 'REJECTED']
    : booking.status === 'APPROVED' ? ['COMPLETED', 'CANCELLED'] : [];
  const canComplete = new Date(booking.endDateTime).getTime() <= Date.now();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action || busy || stale) return;
    if (needsReason && !note.trim()) { setError('กรุณาระบุเหตุผลก่อนยืนยัน'); return; }
    setBusy(true); setError('');
    try { await onSave(action, note.trim()); }
    catch (cause) {
      setError((cause as Error).message);
      if (cause instanceof ApiError && [404, 409].includes(cause.status)) setStale(true);
      setBusy(false);
    }
  }

  return <Dialog wide title="รายละเอียดและพิจารณาการจอง" onClose={() => { if (!busy) onClose(); }}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div><p className="break-all text-sm font-semibold text-blue-700">{booking.bookingNumber}</p><p className="mt-1 text-xs text-slate-500">จองเมื่อ {bookingDate(booking.createdAt)} · Asia/Bangkok</p></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${bookingColors[booking.status]}`}>● {bookingLabels[booking.status]}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-4 text-sm font-semibold">ผู้จองและผู้ขับขี่</h3><dl className="grid grid-cols-2 gap-4">
          <Detail label="ชื่อผู้จอง">{booking.user.name}</Detail><Detail label="เบอร์โทรศัพท์">{booking.user.phoneNumber || 'ไม่ระบุ'}</Detail>
          <div className="col-span-2"><Detail label="อีเมล"><span className="break-all">{booking.user.email}</span></Detail></div>
          <Detail label="ชื่อผู้ขับขี่">{booking.driverName || 'ไม่ระบุ'}</Detail><Detail label="เลขใบขับขี่สากล">{booking.internationalDrivingPermit || 'ไม่ระบุ'}</Detail>
          <div className="col-span-2"><Detail label="ช่องทางการจอง">{booking.source === 'REGISTER_AND_BOOK' ? 'สมัครสมาชิกพร้อมจอง' : 'สมาชิกเดิม'}</Detail></div>
        </dl><Link href={`/admin/members?search=${encodeURIComponent(booking.user.email)}`} className="mt-4 inline-block text-xs text-blue-600 hover:underline">ดูประวัติสมาชิก →</Link></section>
        <section className="rounded-xl border border-slate-200 p-4"><h3 className="mb-4 text-sm font-semibold">รถยนต์และกำหนดการ</h3>
          <p className="font-semibold text-slate-900">{bookingCarName(booking)}</p><p className="mt-1 text-xs text-slate-500">ทะเบียน {bookingSnapshot(booking, 'licensePlate', booking.car.licensePlate)} · {bookingSnapshot(booking, 'providerName', booking.car.providerName || 'FUNCH Rental')}</p>
          <dl className="mt-4 space-y-4"><Detail label="รับรถ"><strong>{pickup.name}</strong><span className="mt-1 block">{bookingDate(booking.startDateTime, pickup.timeZone)}</span><span className="text-[11px] text-slate-500">{pickup.timeZone}</span></Detail>
          <Detail label="คืนรถ"><strong>{dropoff.name}</strong><span className="mt-1 block">{bookingDate(booking.endDateTime, dropoff.timeZone)}</span><span className="text-[11px] text-slate-500">{dropoff.timeZone}</span></Detail></dl>
        </section>
      </div>
      <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">ราคาที่บันทึก ณ เวลาจอง</h3><p className="mt-2 text-sm text-slate-700">{booking.calculatedDays} วัน + {booking.calculatedHours} ชั่วโมง</p></div><p className="text-2xl font-bold text-blue-700">{bookingMoney(booking.totalPrice, booking.currencyCode)} <span className="text-xs font-normal">{booking.currencyCode}</span></p></div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">{booking.dailyRate !== null && <span>รายวัน {bookingMoney(booking.dailyRate, booking.currencyCode)}</span>}{booking.hourlyRate !== null && <span>รายชั่วโมง {bookingMoney(booking.hourlyRate, booking.currencyCode)}</span>}<span>เตรียมรถหลังคืน {booking.turnaroundMinutes} นาที</span></div>
        {booking.pricingDetails?.breakdown && <p className="mt-3 break-words text-xs leading-6 text-slate-600">{booking.pricingDetails.breakdown}</p>}
        <p className="mt-2 text-[11px] leading-6 text-slate-500">เกิน 8 ชั่วโมงคิด 1 วัน · เศษเวลาที่คืนหลัง 14:00 น. คิดรายวันตามเขตเวลาสาขารับรถ</p>
      </section>
      {(booking.reviewedAt || booking.adminNote) && <section className="rounded-xl bg-slate-50 p-4"><h3 className="text-sm font-semibold">ผลการพิจารณาล่าสุด</h3><p className="mt-2 text-xs text-slate-500">{booking.approvedBy?.name || 'ผู้ดูแลระบบ'}{booking.reviewedAt ? ` · ${bookingDate(booking.reviewedAt)} · Asia/Bangkok` : ''}</p>{booking.adminNote && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{booking.adminNote}</p>}</section>}
      {actions.length > 0 && <form onSubmit={submit} className="border-t border-slate-200 pt-5" aria-busy={busy}>
        <h3 className="text-sm font-semibold">พิจารณารายการจอง</h3><p className="mt-1 text-xs leading-6 text-slate-500">ตรวจสอบข้อมูลผู้ขับขี่ กำหนดการ และยอดรวมก่อนยืนยัน ระบบจะตรวจสอบตารางรถอีกครั้งเมื่อบันทึก</p>
        <div className="mt-3 flex flex-wrap gap-2">{actions.map((item) => <button key={item} type="button" disabled={busy || stale || item === 'COMPLETED' && !canComplete} aria-pressed={action === item} onClick={() => { setAction(item); setError(''); }} className={`rounded-xl border px-4 py-2.5 text-xs font-medium ${action === item ? `${actionColors[item]} border-transparent text-white` : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>{actionLabels[item]}</button>)}</div>
        {booking.status === 'APPROVED' && !canComplete && <p className="mt-2 text-[11px] text-slate-500">ยืนยันรับรถคืนได้เมื่อถึงกำหนดคืนรถ</p>}
        {action && <div className="mt-4 space-y-3"><label className="block text-xs font-medium text-slate-600">{needsReason ? 'เหตุผล (จำเป็น)' : 'บันทึกของแอดมิน (ไม่บังคับ)'}<textarea value={note} onChange={(event) => setNote(event.target.value)} required={needsReason} maxLength={2000} disabled={busy || stale} rows={3} placeholder={needsReason ? 'ระบุเหตุผลประกอบการพิจารณา' : 'บันทึกผลการตรวจสอบ'} className="form-input mt-2 resize-y" /></label><p className="text-right text-[10px] text-slate-400">{note.length}/2,000</p><p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">{action === 'APPROVED' ? 'ยืนยันอนุมัติรายการนี้และบันทึกชื่อผู้พิจารณา' : action === 'COMPLETED' ? 'ยืนยันว่าได้รับรถคืนและตรวจสภาพแล้ว ระบบจะย้ายรถไปสาขาคืนและเริ่มเวลาเตรียมรถ' : 'รายการนี้จะหยุดกันรถในตารางจอง โปรดตรวจสอบเหตุผลก่อนยืนยัน'}</p></div>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs">{stale ? 'ปิดเพื่อรีเฟรชข้อมูล' : 'ปิดหน้าต่าง'}</button>{action && <button type="submit" disabled={busy || stale || needsReason && !note.trim()} className={`rounded-xl px-4 py-2.5 text-xs font-medium text-white ${actionColors[action]}`}>{busy ? 'กำลังบันทึก…' : `ยืนยัน${actionLabels[action]}`}</button>}</div>
      </form>}
    </div>
  </Dialog>;
}
