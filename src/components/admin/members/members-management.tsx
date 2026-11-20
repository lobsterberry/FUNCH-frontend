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
  memberDate,
  memberMoney,
  memberRequest,
  membersCsv,
  type AdminMember,
  type MemberInput,
  type MemberList,
} from "@/lib/members-management";
import { AdminIcon } from "../layout/admin-icon";
import { Dialog } from "@/components/shared/dialog";
import { MemberForm } from "./member-form";
import { MemberDetails } from "./member-details";

type Modal =
  | { kind: "form"; member: AdminMember | null }
  | { kind: "details"; id: string }
  | { kind: "status"; member: AdminMember };

function StatusDialog({
  member,
  onClose,
  onSave,
}: {
  member: AdminMember;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onSave();
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={member.isActive ? "ยืนยันระงับบัญชี" : "ยืนยันเปิดใช้งานบัญชี"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="text-sm leading-7 text-slate-600">
        {member.isActive ? "ต้องการระงับบัญชีของ" : "ต้องการเปิดใช้งานบัญชีของ"}{" "}
        <strong className="text-slate-900">{member.name}</strong> (
        {member.email}) ใช่หรือไม่
      </p>
      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
        {member.isActive
          ? "สมาชิกจะถูกออกจากระบบทุกอุปกรณ์และไม่สามารถเข้าสู่ระบบหรือจองเพิ่มได้ รายการจองเดิมยังคงอยู่"
          : "สมาชิกจะสามารถเข้าสู่ระบบด้วยรหัสผ่านเดิมและจองรถได้อีกครั้ง"}
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <button
          disabled={busy}
          onClick={onClose}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs"
        >
          ยกเลิก
        </button>
        <button
          disabled={busy}
          onClick={() => void submit()}
          className={`rounded-xl px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${member.isActive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {busy
            ? "กำลังบันทึก…"
            : member.isActive
              ? "ยืนยันระงับบัญชี"
              : "ยืนยันเปิดใช้งาน"}
        </button>
      </div>
    </Dialog>
  );
}

export function MembersManagement({ currentMemberId }: { currentMemberId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const search = (params.get("search") || "").slice(0, 254);
  const role = ["USER", "ADMIN"].includes(params.get("role") || "")
    ? params.get("role")!
    : "all";
  const status = ["active", "suspended"].includes(params.get("status") || "")
    ? params.get("status")!
    : "all";
  const rawPage = Number(params.get("page"));
  const page =
    Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 1_000_000
      ? rawPage
      : 1;
  const query = new URLSearchParams({
    search,
    role,
    status,
    page: String(page),
  }).toString();
  const [data, setData] = useState<MemberList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const [exporting, setExporting] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await memberRequest<MemberList>(`?${query}`);
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
    router.replace(`/admin/members?${next}`, { scroll: false });
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({
      search: String(new FormData(event.currentTarget).get("search")).trim(),
      page: "1",
    });
  }
  async function save(input: MemberInput) {
    if (modal?.kind !== "form") return;
    const member = modal.member;
    await memberRequest(
      member ? `/${encodeURIComponent(member.id)}` : "",
      member ? "PATCH" : "POST",
      input,
    );
    setModal(null);
    setNotice(
      member
        ? "บันทึกข้อมูลสมาชิกเรียบร้อยแล้ว"
        : "เพิ่มสมาชิกใหม่เรียบร้อยแล้ว",
    );
    if (member?.id === currentMemberId) router.refresh();
    await load();
  }
  async function changeStatus(member: AdminMember) {
    await memberRequest(`/${encodeURIComponent(member.id)}`, "PATCH", {
      isActive: !member.isActive,
    });
    setModal(null);
    setNotice(
      member.isActive
        ? "ระงับบัญชีเรียบร้อยแล้ว"
        : "เปิดใช้งานบัญชีเรียบร้อยแล้ว",
    );
    await load();
  }
  async function exportMembers() {
    setExporting(true);
    setError("");
    try {
      const filters = new URLSearchParams({
        search,
        role,
        status,
        pageSize: "100",
        page: "1",
      });
      const first = await memberRequest<MemberList>(`?${filters}`);
      const members = [...first.data];
      for (let next = 2; next <= first.pagination.totalPages; next++) {
        filters.set("page", String(next));
        members.push(...(await memberRequest<MemberList>(`?${filters}`)).data);
      }
      const url = URL.createObjectURL(
        new Blob([membersCsv(members)], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "funch-members.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        `ส่งออกรายชื่อ ${members.length.toLocaleString("th-TH")} รายการตามตัวกรองเรียบร้อยแล้ว`,
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setExporting(false);
    }
  }
  const summary = data?.summary;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-blue-600">
            MEMBER DIRECTORY
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            จัดการสมาชิก
          </h1>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            ดูแลข้อมูลสมาชิก สิทธิ์การใช้งาน และประวัติการจองรถในที่เดียว
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={exporting || loading || !data?.pagination.total}
            onClick={() => void exportMembers()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {exporting ? "กำลังส่งออก…" : "ส่งออกรายชื่อ CSV"}
          </button>
          <button
            onClick={() => {
              setNotice("");
              setModal({ kind: "form", member: null });
            }}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-xs"
          >
            <AdminIcon name="plus" className="h-4 w-4" />
            เพิ่มสมาชิกใหม่
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {(
          [
            {
              label: "สมาชิกทั้งหมด",
              value: summary?.total,
              color: "text-blue-600",
              bg: "bg-blue-50",
              icon: "users",
            },
            {
              label: "เปิดใช้งาน",
              value: summary?.active,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              icon: "check",
            },
            {
              label: "ผู้ดูแลระบบ",
              value: summary?.admins,
              color: "text-purple-600",
              bg: "bg-purple-50",
              icon: "users",
            },
            {
              label: "ระงับบัญชี",
              value: summary?.suspended,
              color: "text-red-600",
              bg: "bg-red-50",
              icon: "users",
            },
          ] as const
        ).map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className={`mt-2 text-2xl font-bold ${item.color}`}>
                {item.value === undefined
                  ? "—"
                  : item.value.toLocaleString("th-TH")}{" "}
                <span className="text-xs font-normal text-slate-400">คน</span>
              </p>
            </div>
            <span
              className={`hidden rounded-xl p-3 sm:block ${item.bg} ${item.color}`}
            >
              <AdminIcon name={item.icon} />
            </span>
          </div>
        ))}
      </div>
      {notice && (
        <p
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
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
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          <button onClick={() => void load()} className="ml-3 underline">
            ลองอีกครั้ง
          </button>
        </div>
      )}
      <section
        aria-label="รายชื่อสมาชิก"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-4 sm:p-5">
          <form
            onSubmit={filter}
            className="flex w-full min-w-0 items-end gap-2 md:w-auto md:flex-1"
          >
            <label className="min-w-0 flex-1 text-xs font-medium text-slate-600">
              ค้นหาสมาชิก
              <input
                key={search}
                name="search"
                type="search"
                maxLength={254}
                defaultValue={search}
                placeholder="ชื่อ อีเมล หรือเบอร์โทรศัพท์"
                className="form-input mt-2"
              />
            </label>
            <button
              aria-label="ค้นหา"
              className="flex h-[42px] items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs text-white hover:bg-slate-800"
            >
              <AdminIcon name="search" className="h-4 w-4" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>
          </form>
          <label className="text-xs font-medium text-slate-600">
            สิทธิ์
            <select
              value={role}
              onChange={(event) =>
                navigate({ role: event.target.value, page: "1" })
              }
              className="form-input mt-2"
            >
              <option value="all">ทุกสิทธิ์</option>
              <option value="USER">USER · สมาชิก</option>
              <option value="ADMIN">ADMIN · ผู้ดูแลระบบ</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            สถานะ
            <select
              value={status}
              onChange={(event) =>
                navigate({ status: event.target.value, page: "1" })
              }
              className="form-input mt-2"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="suspended">ระงับบัญชี</option>
            </select>
          </label>
          {(search || role !== "all" || status !== "all") && (
            <button
              onClick={() =>
                router.replace("/admin/members", { scroll: false })
              }
              className="py-3 text-xs text-blue-600 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}
          <button
            aria-label="โหลดรายชื่อสมาชิกใหม่"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-xl border border-slate-200 px-3 py-3 text-xs text-slate-500 disabled:opacity-40"
          >
            รีเฟรช
          </button>
        </div>
        <div className="overflow-x-auto" aria-busy={loading}>
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500">
              <tr>
                {[
                  "สมาชิก / ข้อมูลติดต่อ",
                  "สิทธิ์",
                  "วันที่สมัคร",
                  "การจอง",
                  "ยอดอนุมัติ/สำเร็จ",
                  "สถานะ",
                  "จัดการ",
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
                    <span role="status">กำลังโหลดรายชื่อสมาชิก…</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    ไม่สามารถแสดงรายชื่อได้ กรุณาลองอีกครั้ง
                  </td>
                </tr>
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <AdminIcon
                      name="users"
                      className="mx-auto mb-3 h-8 w-8 text-slate-300"
                    />
                    <p className="text-sm font-medium text-slate-600">
                      {search || role !== "all" || status !== "all"
                        ? "ไม่พบสมาชิกที่ตรงกับตัวกรอง"
                        : "ยังไม่มีสมาชิกในระบบ"}
                    </p>
                    <p className="mt-2 text-slate-400">
                      {search || role !== "all" || status !== "all"
                        ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"
                        : "เริ่มต้นด้วยการเพิ่มสมาชิกใหม่"}
                    </p>
                  </td>
                </tr>
              ) : (
                data.data.map((member) => {
                  const self = member.id === currentMemberId;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${member.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {Array.from(member.name)
                              .slice(0, 2)
                              .join("")
                              .toLocaleUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <button
                              onClick={() =>
                                setModal({ kind: "details", id: member.id })
                              }
                              className="text-left text-sm font-semibold text-slate-900 hover:text-blue-600"
                            >
                              {member.name}
                            </button>
                            {self && (
                              <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">
                                คุณ
                              </span>
                            )}
                            <p className="mt-1 break-all text-[11px] text-slate-500">
                              {member.email}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {member.phoneNumber || "ไม่ระบุเบอร์โทรศัพท์"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${member.role === "ADMIN" ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                        {memberDate(member.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {member.bookingCount.toLocaleString("th-TH")} ครั้ง
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-800">
                        {memberMoney(member.totalSpend)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                        >
                          ● {member.isActive ? "เปิดใช้งาน" : "ระงับบัญชี"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              setModal({ kind: "details", id: member.id })
                            }
                            className="whitespace-nowrap rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
                          >
                            ดูประวัติ
                          </button>
                          <button
                            onClick={() => setModal({ kind: "form", member })}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-100"
                          >
                            แก้ไข
                          </button>
                          {!self && (
                            <button
                              onClick={() =>
                                setModal({ kind: "status", member })
                              }
                              className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] ${member.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                            >
                              {member.isActive ? "ระงับบัญชี" : "เปิดใช้งาน"}
                            </button>
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
              ? `แสดง ${data.pagination.total ? (data.pagination.page - 1) * data.pagination.pageSize + 1 : 0}–${Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.total)} จาก ${data.pagination.total.toLocaleString("th-TH")} รายชื่อ`
              : "รายชื่อสมาชิก"}
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled={
                loading || !!error || !data || data.pagination.page <= 1
              }
              onClick={() =>
                navigate({ page: String((data?.pagination.page || 1) - 1) })
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </section>
      <p className="text-[11px] leading-6 text-slate-400">
        ยอดรวมคิดจากรายการจองที่อนุมัติหรือเสร็จสิ้นในสกุลเงินบาท •
        การระงับสมาชิกไม่ยกเลิกรายการจองเดิม
      </p>
      {modal?.kind === "form" && (
        <MemberForm
          member={modal.member}
          currentMemberId={currentMemberId}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
      {modal?.kind === "details" && (
        <MemberDetails id={modal.id} onClose={() => setModal(null)} />
      )}
      {modal?.kind === "status" && (
        <StatusDialog
          member={modal.member}
          onClose={() => setModal(null)}
          onSave={() => changeStatus(modal.member)}
        />
      )}
    </div>
  );
}
