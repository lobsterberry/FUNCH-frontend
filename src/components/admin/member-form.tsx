"use client";

import { useState, type FormEvent } from 'react';
import type { AdminMember, MemberInput } from '@/lib/admin-members';
import { Dialog } from '../rental-dialog';

export function MemberForm({ member, currentMemberId, onClose, onSave }: {
  member: AdminMember | null; currentMemberId: string; onClose: () => void;
  onSave: (input: MemberInput) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const self = member?.id === currentMemberId;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: MemberInput = { name: String(form.get('name')).trim(), email: String(form.get('email')).trim(),
      phoneNumber: String(form.get('phoneNumber')).trim() || null,
      role: self ? 'ADMIN' : form.get('role') as MemberInput['role'],
      isActive: self || form.get('isActive') === 'true',
      ...(!member ? { password: String(form.get('password')) } : {}),
    };
    setBusy(true); setError('');
    try { await onSave(input); }
    catch (cause) { setError((cause as Error).message); setBusy(false); }
  }
  return <Dialog title={member ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มสมาชิกใหม่'} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="space-y-4">
      <p className="text-xs leading-6 text-slate-500">{member ? 'ปรับปรุงข้อมูลติดต่อและสิทธิ์การใช้งานของสมาชิก' : 'สร้างบัญชีสมาชิกหรือผู้ดูแลระบบ พร้อมรหัสผ่านสำหรับเข้าสู่ระบบ'}</p>
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <label className="block text-xs font-medium">ชื่อ-นามสกุล <span className="text-red-500">*</span><input name="name" autoComplete="name" required maxLength={100} defaultValue={member?.name} className="form-input mt-2" /></label>
        <label className="block text-xs font-medium">อีเมล <span className="text-red-500">*</span><input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={member?.email} className="form-input mt-2" /></label>
        <label className="block text-xs font-medium">เบอร์โทรศัพท์<input name="phoneNumber" type="tel" autoComplete="tel" maxLength={30} defaultValue={member?.phoneNumber ?? ''} placeholder="เช่น 081 234 5678" className="form-input mt-2" /></label>
        {!member && <label className="block text-xs font-medium">รหัสผ่านเริ่มต้น <span className="text-red-500">*</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} aria-describedby="member-password-help" className="form-input mt-2" /><span id="member-password-help" className="mt-1 block font-normal text-slate-500">8–128 ตัวอักษร แจ้งรหัสผ่านให้เจ้าของบัญชีผ่านช่องทางที่ปลอดภัย</span></label>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium">สิทธิ์การใช้งาน<select name="role" disabled={self} defaultValue={member?.role ?? 'USER'} className="form-input mt-2 disabled:bg-slate-100"><option value="USER">USER · สมาชิก</option><option value="ADMIN">ADMIN · ผู้ดูแลระบบ</option></select></label>
          <label className="block text-xs font-medium">สถานะบัญชี<select name="isActive" disabled={self} defaultValue={String(member?.isActive ?? true)} className="form-input mt-2 disabled:bg-slate-100"><option value="true">เปิดใช้งาน</option><option value="false">ระงับบัญชี</option></select></label>
        </div>
        {self && <p className="rounded-xl bg-blue-50 p-3 text-xs leading-6 text-blue-700">คุณกำลังแก้ไขบัญชีของตนเอง จึงไม่สามารถลดสิทธิ์หรือระงับบัญชีนี้ได้</p>}
        {member && !self && <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">การเปลี่ยนสิทธิ์หรือระงับบัญชีจะออกจากระบบทุกอุปกรณ์ การระงับบัญชีไม่ยกเลิกรายการจองเดิม</p>}
      </fieldset>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-xs hover:bg-slate-50">ยกเลิก</button><button disabled={busy} className="btn-primary px-5 py-2 text-xs">{busy ? 'กำลังบันทึก…' : 'บันทึกสมาชิก'}</button></div>
    </form>
  </Dialog>;
}
