"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminIcon } from '../layout/admin-icon';
import { dateLabel, dateTimeLabel, presetRange, reportGrowth, reportMoney, reportNumber, reportStatuses,
  type BookingReport, type ReportFilters, type ReportStatus } from '@/lib/admin-reports';

const panel = 'rounded-2xl border border-slate-200 bg-white shadow-sm';
const control = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800';
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50';
const presets = [['today', 'วันนี้'], ['7d', '7 วันล่าสุด'], ['30d', '30 วันล่าสุด'], ['month', 'เดือนนี้'], ['lastMonth', 'เดือนที่แล้ว'], ['quarter', 'ไตรมาสนี้'], ['year', 'ปีนี้ (YTD)']];

function SectionTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}</div>{children}</div>;
}
function Metric({ title, value, note, growth, featured = false, icon }: { title: string; value: string; note: string; growth?: string | null; featured?: boolean; icon: 'report' | 'booking' | 'check' | 'users' }) {
  return <article className={`min-w-0 rounded-2xl border p-5 shadow-sm ${featured ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-indigo-700 text-white' : 'border-slate-200 bg-white'}`}>
    <div className={`mb-4 flex items-center justify-between text-xs ${featured ? 'text-blue-100' : 'text-slate-500'}`}><span>{title}</span><span className={`rounded-lg p-2 ${featured ? 'bg-white/10' : 'bg-slate-50 text-blue-600'}`}><AdminIcon name={icon} className="h-4 w-4" /></span></div>
    <p className={`break-words text-2xl font-semibold tracking-tight ${featured ? 'text-white' : 'text-slate-900'}`}>{value}</p>
    <div className={`mt-3 flex flex-wrap items-center gap-2 text-[11px] ${featured ? 'text-blue-100' : 'text-slate-500'}`}>{growth && <span className={`rounded-md px-1.5 py-0.5 font-medium ${featured ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-700'}`}>{growth}</span>}<span>{note}</span></div>
  </article>;
}

function Trend({ data, currency }: { data: BookingReport; currency: string }) {
  const [mode, setMode] = useState<'amount' | 'bookings'>('amount');
  const values = data.trend.map((item) => mode === 'amount' ? Number(item.amounts[currency] ?? 0) : item.bookings);
  const max = Math.max(...values, 1);
  const width = Math.max(600, data.trend.length * 20);
  const chartHeight = 172;
  const barWidth = (width - 24) / Math.max(values.length, 1);
  const labelEvery = Math.max(1, Math.ceil(values.length / 7));
  const tick = (day: string) => data.interval === 'month'
    ? new Intl.DateTimeFormat('th-TH', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${day}-01T00:00:00Z`))
    : new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`));
  return <section className={`${panel} min-w-0 p-5 sm:p-6`}><SectionTitle title="แนวโน้มยอดจอง" subtitle={`${data.interval === 'month' ? 'รายเดือน' : 'รายวัน'} • ${mode === 'amount' ? `มูลค่าอนุมัติ + เสร็จสิ้น (${currency})` : 'จำนวนคำขอจองทุกสถานะ'}`}>
    <div className="flex rounded-lg bg-slate-100 p-1 text-[11px]">{([['amount', 'มูลค่าการจอง'], ['bookings', 'จำนวนจอง']] as const).map(([key, label]) => <button key={key} onClick={() => setMode(key)} aria-pressed={mode === key} className={`rounded-md px-2.5 py-1.5 ${mode === key ? 'bg-white font-medium text-blue-600 shadow-sm' : 'text-slate-500'}`}>{label}</button>)}</div>
  </SectionTitle>
    <div className="mb-2 flex justify-between text-[10px] text-slate-400"><span>0</span><span>ค่าสูงสุด {reportNumber(max === 1 && values.every((v) => !v) ? 0 : max)} {mode === 'amount' ? currency : 'ครั้ง'}</span></div>
    <div className="overflow-x-auto pb-1"><svg role="img" aria-label={`กราฟ${mode === 'amount' ? 'มูลค่าการจอง' : 'จำนวนจอง'} ${dateLabel(data.filters.start)} ถึง ${dateLabel(data.filters.end)}`} viewBox={`0 0 ${width} 220`} className="h-56 w-full min-w-[600px]">
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1="8" x2={width - 8} y1={12 + chartHeight * ratio} y2={12 + chartHeight * ratio} stroke="#e2e8f0" strokeDasharray={ratio === 1 ? undefined : '3 4'} />)}
      {data.trend.map((item, index) => { const height = values[index] / max * chartHeight; const x = 12 + index * barWidth; return <g key={item.date}>
        <rect x={x + 2} y={12 + chartHeight - height} width={Math.max(2, barWidth - 5)} height={height} rx="3" fill={mode === 'amount' ? '#2563eb' : '#6366f1'}><title>{tick(item.date)}: {mode === 'amount' ? reportMoney(values[index], currency) : `${reportNumber(values[index])} ครั้ง`}</title></rect>
        {index % labelEvery === 0 && <text x={x + barWidth / 2} y="208" textAnchor="middle" fontSize="10" fill="#64748b">{tick(item.date)}</text>}
      </g>; })}
    </svg></div>
    {values.every((value) => value === 0) && <p className="mt-1 text-center text-xs text-slate-400">ไม่มี{mode === 'amount' ? `ยอดอนุมัติหรือเสร็จสิ้นในสกุล ${currency}` : 'รายการจอง'}ในช่วงนี้</p>}
    <details className="mt-3 text-xs text-slate-500 print:hidden"><summary className="cursor-pointer">ดูข้อมูลกราฟเป็นตาราง</summary><div className="mt-3 max-h-48 overflow-auto"><table className="w-full text-left"><thead><tr><th className="py-2">วันที่</th><th>จำนวนจอง</th><th className="text-right">มูลค่า ({currency})</th></tr></thead><tbody>{data.trend.map((item) => <tr key={item.date} className="border-t border-slate-100"><td className="py-1.5">{tick(item.date)}</td><td>{item.bookings}</td><td className="text-right">{reportMoney(item.amounts[currency] ?? 0, currency)}</td></tr>)}</tbody></table></div></details>
  </section>;
}

export function AdminReports({ today }: { today: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRange = presetRange('30d', today);
  const filters: ReportFilters = { start: params.get('start') || defaultRange.start, end: params.get('end') || defaultRange.end,
    basis: params.get('basis') || 'createdAt', comparison: params.get('comparison') || 'previous', country: params.get('country') || 'all',
    category: params.get('category') || 'all', currency: params.get('currency') || 'all' };
  const query = new URLSearchParams({ ...filters, page: params.get('page') || '1' }).toString();
  const [data, setData] = useState<BookingReport | null>(null);
  const [loadedQuery, setLoadedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState('THB');
  const requestId = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const requests = requestId;
    const id = ++requests.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError(''); setExportError('');
      try {
        const response = await fetch(`/api/admin/reports?${query}`, { cache: 'no-store', signal: controller.signal });
        if (response.status === 401 || response.status === 403) { router.replace('/admin/login'); router.refresh(); return; }
        if (response.status === 400) throw new Error('ช่วงวันที่หรือตัวกรองไม่ถูกต้อง กรุณาเลือกช่วง 1–366 วัน');
        const isJson = response.headers.get('content-type')?.split(';')[0] === 'application/json';
        const result = response.ok && isJson ? await response.json().catch(() => null) : null;
        if (!result?.success || !result.data) throw new Error('โหลดรายงานไม่สำเร็จ กรุณาลองอีกครั้ง');
        if (id === requestId.current) { setData(result.data); setLoadedQuery(query); }
      } catch (cause) { if (!controller.signal.aborted && id === requestId.current) setError(cause instanceof TypeError ? 'เชื่อมต่อระบบไม่สำเร็จ กรุณาลองอีกครั้ง' : (cause as Error).message); }
      finally { if (id === requestId.current) setLoading(false); }
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); requests.current++; };
  }, [query, refresh, router]);

  function navigate(changes: Record<string, string>) {
    const nextQuery = new URLSearchParams({ ...filters, page: '1', ...changes }).toString();
    if (nextQuery === query) setRefresh((value) => value + 1);
    else router.replace(`/admin/reports?${nextQuery}`, { scroll: false });
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
    if (next.end < next.start || Date.parse(next.end) - Date.parse(next.start) >= 366 * 86_400_000) {
      setExportError('กรุณาเลือกวันที่สิ้นสุดหลังวันที่เริ่มต้น และช่วงไม่เกิน 366 วัน'); return;
    }
    navigate(next);
  }
  async function exportCsv() {
    if (!data) return;
    setExporting(true); setExportError('');
    try {
      const response = await fetch(`/api/admin/reports?${new URLSearchParams({ ...data.filters, format: 'csv' })}`, { cache: 'no-store' });
      if (response.status === 401 || response.status === 403) { router.replace('/admin/login'); router.refresh(); return; }
      if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'text/csv') {
        throw new Error('ส่งออกรายงานไม่สำเร็จ กรุณาลองอีกครั้ง');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `funch-booking-report-${data.filters.start}-${data.filters.end}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setExportError((cause as Error).message); }
    finally { setExporting(false); }
  }
  const currencies = data?.summary.currencies ?? [];
  const currency = currencies.some((item) => item.currency === displayCurrency) ? displayCurrency : currencies[0]?.currency ?? (filters.currency === 'all' ? 'THB' : filters.currency);
  const money = currencies.find((item) => item.currency === currency);
  const previousMoney = data?.comparison?.summary.currencies.find((item) => item.currency === currency);
  const comparisonNote = data?.comparison ? 'เทียบช่วงเปรียบเทียบ' : 'ในช่วงที่เลือก';
  const topCars = data?.topCars.filter((car) => car.currency === currency).slice(0, 5) ?? [];
  const ready = Boolean(data && !loading && !error && loadedQuery === query);
  return <div className="report-page space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-blue-600">ANALYTICS & FINANCIAL REPORT</p><h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">รายงานสรุปยอดจองรถ</h1><p className="mt-2 text-xs leading-6 text-slate-500">ภาพรวมการจอง มูลค่าการเช่า และผลการดำเนินงานของ FUNCH</p></div>
      <div className="flex flex-wrap gap-2 print:hidden"><button className={button} disabled={!ready || exporting} onClick={() => void exportCsv()}><AdminIcon name="report" className="h-4 w-4" />{exporting ? 'กำลังส่งออก…' : 'ส่งออก CSV (Excel)'}</button><button className={`${button} border-slate-900! bg-slate-900! text-white! hover:bg-slate-800!`} disabled={!ready} onClick={() => window.print()}>พิมพ์ / บันทึก PDF</button></div>
    </div>

    <section className={`${panel} overflow-hidden print:hidden`} aria-label="ตัวกรองรายงาน">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-4"><div className="flex items-center gap-2 text-sm font-medium"><AdminIcon name="booking" className="h-4 w-4 text-blue-600" />เลือกช่วงเวลาและมิติรายงาน</div><span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] text-blue-700">เขตเวลารายงาน: Asia/Bangkok (UTC+7)</span></div>
      <div className="p-5"><div className="mb-5 flex flex-wrap gap-2">{presets.map(([key, label]) => { const range = presetRange(key, today); const active = range.start === filters.start && range.end === filters.end; return <button key={key} onClick={() => navigate(range)} aria-pressed={active} className={`rounded-lg border px-3 py-2 text-xs transition ${active ? 'border-blue-200 bg-blue-50 font-medium text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}>{label}</button>; })}</div>
      <form ref={formRef} key={`${query}:${data?.options.countries.map((country) => country.code).join(',') ?? ''}`} onSubmit={apply} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-medium text-slate-600">ตั้งแต่วันที่<input type="date" name="start" required min="2000-01-01" max="2100-12-31" defaultValue={filters.start} className={control} /></label>
        <label className="text-xs font-medium text-slate-600">ถึงวันที่ (รวมวันสิ้นสุด)<input type="date" name="end" required min="2000-01-01" max="2100-12-31" defaultValue={filters.end} className={control} /></label>
        <label className="text-xs font-medium text-slate-600">วันที่ที่ใช้อ้างอิง<select name="basis" defaultValue={filters.basis} className={control}><option value="createdAt">วันที่ทำรายการจอง</option><option value="startDateTime">วันที่รับรถ</option></select></label>
        <label className="text-xs font-medium text-slate-600">เปรียบเทียบกับ<select name="comparison" defaultValue={filters.comparison} className={control}><option value="previous">ช่วงก่อนหน้า (จำนวนวันเท่ากัน)</option><option value="year">ช่วงเดียวกันของปีก่อน</option><option value="none">ไม่เปรียบเทียบ</option></select></label>
        <label className="text-xs font-medium text-slate-600">ประเทศจุดรับรถ<select name="country" defaultValue={filters.country} className={control}><option value="all">ทุกประเทศ</option>{data?.options.countries.map((country) => <option key={country.code} value={country.code}>{country.flag} {country.nameTh}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">ประเภทรถ<select name="category" defaultValue={filters.category} className={control}><option value="all">ทุกประเภทรถ</option>{['SUV', 'SEDAN', 'MPV', 'EV', 'ECO', 'LUXURY', 'WAGON'].map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">สกุลเงินของการจอง<select name="currency" defaultValue={filters.currency} className={control}><option value="all">ทุกสกุลเงิน (แยกยอด)</option>{[...new Set(['THB', ...(data?.options.currencies ?? []), ...(filters.currency !== 'all' ? [filters.currency] : [])])].map((code) => <option key={code}>{code}</option>)}</select></label>
        <div className="flex items-end gap-2"><button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-medium text-white hover:bg-blue-700"><AdminIcon name="search" className="h-4 w-4" />เรียกดูรายงาน</button><button type="button" className={button} onClick={() => { formRef.current?.reset(); router.replace('/admin/reports', { scroll: false }); setRefresh((value) => value + 1); }}>รีเซ็ต</button></div>
      </form></div>
    </section>
    {exportError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">{exportError}</p>}
    {loading && <div role="status" className={`${panel} px-6 py-16 text-center text-sm text-slate-500`}><span className="mx-auto mb-4 block h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />กำลังคำนวณรายงาน…</div>}
    {error && !loading && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"><p className="text-sm text-red-700">{error}</p><button className={`${button} mt-4`} onClick={() => setRefresh((value) => value + 1)}>ลองอีกครั้ง</button></div>}
    {data && ready && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-700">{dateLabel(data.filters.start)} – {dateLabel(data.filters.end)}</p><p className="mt-1 text-[11px] text-slate-500">{data.filters.basis === 'createdAt' ? 'ตามวันที่ทำรายการจอง' : 'ตามวันที่รับรถ'} • {data.comparison ? `เทียบ ${dateLabel(data.comparison.start)} – ${dateLabel(data.comparison.end)}` : 'ไม่เปรียบเทียบ'} • สถานะปัจจุบัน</p><p className="mt-1 text-[11px] text-slate-500">{data.filters.country === 'all' ? 'ทุกประเทศ' : data.options.countries.find((country) => country.code === data.filters.country)?.nameTh ?? data.filters.country} • {data.filters.category === 'all' ? 'ทุกประเภทรถ' : data.filters.category} • {data.filters.currency === 'all' ? 'ทุกสกุลเงิน (แยกยอด)' : data.filters.currency}</p></div>
        <label className="flex items-center gap-2 text-xs text-slate-500">แสดงยอดเงิน<select aria-label="สกุลเงินที่แสดงในกราฟและตัวชี้วัด" value={currency} onChange={(event) => setDisplayCurrency(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">{(currencies.length ? currencies.map((item) => item.currency) : [currency]).map((code) => <option key={code}>{code}</option>)}</select></label>
      </div>
      {data.summary.total === 0 && <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center"><AdminIcon name="report" className="mx-auto mb-2 h-8 w-8 text-blue-400" /><p className="text-sm font-medium text-blue-900">ไม่พบการจองตามเงื่อนไขที่เลือก</p><p className="mt-1 text-xs text-blue-700">ลองเปลี่ยนช่วงเวลา ประเทศ หรือประเภทรถ</p></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title={`มูลค่าอนุมัติ + เสร็จสิ้น (${currency})`} value={reportMoney(money?.confirmed ?? 0, currency)} note={comparisonNote} growth={data.comparison ? reportGrowth(Number(money?.confirmed ?? 0), Number(previousMoney?.confirmed ?? 0)) : null} featured icon="report" />
        <Metric title="คำขอจองทั้งหมด" value={`${reportNumber(data.summary.total)} ครั้ง`} note={`อนุมัติ + เสร็จสิ้น ${reportNumber(data.summary.confirmedCount)} ครั้ง`} growth={reportGrowth(data.summary.total, data.comparison?.summary.total)} icon="booking" />
        <Metric title={`มูลค่าเฉลี่ยต่อยอดยืนยัน (${currency})`} value={reportMoney(money?.average ?? 0, currency)} note="เฉพาะอนุมัติ + เสร็จสิ้น" growth={data.comparison ? reportGrowth(Number(money?.average ?? 0), Number(previousMoney?.average ?? 0)) : null} icon="users" />
        <Metric title="สัดส่วนอนุมัติ + เสร็จสิ้น" value={`${reportNumber(data.summary.approvalRate)}%`} note={`จากคำขอทั้งหมด • รออนุมัติ ${reportNumber(data.summary.statuses.PENDING)} ครั้ง`} icon="check" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]"><Trend data={data} currency={currency} /><section className={`${panel} p-5 sm:p-6`}><SectionTitle title="สถานะการจอง" subtitle="คำขอทุกสถานะในช่วงที่เลือก" />
        <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">{Object.entries(reportStatuses).map(([status, meta]) => <span key={status} className={meta.dot} style={{ width: `${data.summary.total ? data.summary.statuses[status as ReportStatus] / data.summary.total * 100 : 0}%` }} />)}</div>
        <div className="space-y-4">{Object.entries(reportStatuses).map(([status, meta]) => { const count = data.summary.statuses[status as ReportStatus]; return <div key={status} className="flex items-center gap-3 text-xs"><span className={`h-2 w-2 rounded-full ${meta.dot}`} /><span className="flex-1 text-slate-600">{meta.label}</span><span className="font-medium text-slate-900">{reportNumber(count)}</span><span className="w-12 text-right text-slate-400">{reportNumber(data.summary.total ? count / data.summary.total * 100 : 0)}%</span></div>; })}</div>
        <p className="mt-6 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400">อัตรายืนยัน = (อนุมัติ + เสร็จสิ้น) ÷ คำขอทั้งหมด สถานะอาจเปลี่ยนหลังสิ้นสุดช่วงรายงาน</p>
      </section></div>

      <div className="grid gap-6 lg:grid-cols-2"><section className={`${panel} p-5 sm:p-6`}><SectionTitle title="การจองตามประเทศจุดรับรถ" subtitle={`จำนวนจองทุกสถานะ • ยอดอนุมัติ + เสร็จสิ้น (${currency})`} /><div className="space-y-4">{data.countries.map((country) => <div key={country.code}><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-medium text-slate-700"><span className="mr-2 text-base">{country.flag}</span>{country.nameTh} <span className="ml-1 font-normal text-slate-400">{reportNumber(country.count)} ครั้ง</span></span><span className="font-medium text-slate-700">{reportMoney(country.amounts[currency] ?? 0, currency)}</span></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${data.summary.total ? country.count / data.summary.total * 100 : 0}%` }} /></div></div>)}{!data.countries.length && <p className="py-8 text-center text-xs text-slate-400">ไม่มีข้อมูลประเทศ</p>}</div></section>
      <section className={`${panel} p-5 sm:p-6`}><SectionTitle title="พฤติกรรมการจอง" subtitle="โฟลวสมาชิกและรูปแบบค่าเช่าจากผลคำนวณจริง" /><div className="grid grid-cols-2 gap-3">{[['สมาชิกเดิม', data.sources.EXISTING_MEMBER, 'bg-blue-50 text-blue-700'], ['สมัครพร้อมจอง', data.sources.REGISTER_AND_BOOK, 'bg-indigo-50 text-indigo-700'], ['มีค่าเช่ารายวัน', data.pricing.daily, 'bg-emerald-50 text-emerald-700'], ['รายชั่วโมงเท่านั้น', data.pricing.hourlyOnly, 'bg-amber-50 text-amber-700']].map(([label, value, color]) => <div key={String(label)} className={`rounded-xl p-4 ${color}`}><p className="text-[11px]">{label}</p><p className="mt-2 text-2xl font-semibold">{reportNumber(Number(value))}<span className="ml-2 text-[11px] font-normal">ครั้ง</span></p></div>)}</div><p className="mt-4 text-[11px] leading-5 text-slate-400">รายวันรวมรายการที่คิดรายวันร่วมกับรายชั่วโมง • ประเภทรถอ้างอิงหมวดหมู่ปัจจุบัน</p></section></div>

      <section className={`${panel} overflow-hidden`}><div className="px-5 pt-5 sm:px-6"><SectionTitle title={`5 อันดับรถที่มียอดจองสูงสุด (${currency})`} subtitle="เรียงจากมูลค่าอนุมัติ + เสร็จสิ้น • แยกรายคันตามทะเบียน" /></div><div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-xs"><thead className="border-y border-slate-100 bg-slate-50 text-slate-500"><tr><th className="px-6 py-3 font-medium">อันดับ</th><th className="px-4 py-3 font-medium">รถยนต์ / ทะเบียน</th><th className="px-4 py-3 text-right font-medium">ยอดยืนยัน (ครั้ง)</th><th className="px-6 py-3 text-right font-medium">มูลค่าการจอง</th></tr></thead><tbody>{topCars.map((car, index) => <tr key={car.carId} className="border-b border-slate-100"><td className="px-6 py-4"><span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg font-semibold ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span></td><td className="px-4 py-4"><p className="font-medium text-slate-800">{car.name}</p><p className="mt-1 text-[11px] text-slate-400">{car.licensePlate}</p></td><td className="px-4 py-4 text-right text-slate-600">{reportNumber(car.count)}</td><td className="px-6 py-4 text-right font-semibold text-blue-700">{reportMoney(car.amount, currency)}</td></tr>)}{!topCars.length && <tr><td colSpan={4} className="p-8 text-center text-slate-400">ไม่มีรายการอนุมัติหรือเสร็จสิ้นในสกุลเงินนี้</td></tr>}</tbody></table></div></section>

      <section className={`${panel} overflow-hidden print:hidden`}><div className="px-5 pt-5 sm:px-6"><SectionTitle title="รายละเอียดรายการจอง" subtitle={`ทั้งหมด ${reportNumber(data.pagination.total)} รายการ • ส่งออก CSV เพื่อดูรายการครบทุกหน้า`} /></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="border-y border-slate-100 bg-slate-50 text-slate-500"><tr>{['เลขการจอง / วันที่จอง', 'รถยนต์', 'จุดรับรถ', 'รับรถ – คืนรถ (เวลาท้องถิ่น)', 'สถานะ', 'มูลค่าการจอง'].map((title) => <th key={title} className="px-5 py-3 font-medium last:text-right">{title}</th>)}</tr></thead><tbody>{data.bookings.map((booking) => <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/60"><td className="px-5 py-4"><p className="font-medium text-blue-700">{booking.bookingNumber}</p><p className="mt-1 text-[10px] text-slate-400">{dateTimeLabel(booking.createdAt)} (ไทย)</p></td><td className="px-5 py-4"><p className="font-medium text-slate-700">{booking.carName}</p><p className="mt-1 text-[10px] text-slate-400">{booking.licensePlate}</p></td><td className="px-5 py-4 text-slate-600"><p>{booking.country.flag} {booking.country.nameTh}</p><p className="mt-1 text-[10px] text-slate-400">{booking.pickup}</p></td><td className="px-5 py-4 text-[11px] text-slate-600"><p>{dateTimeLabel(booking.startDateTime, booking.timeZone)}</p><p className="mt-1">{dateTimeLabel(booking.endDateTime, booking.timeZone)}</p><p className="mt-1 text-[10px] text-slate-400">{booking.timeZone}</p></td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium ${reportStatuses[booking.status].color}`}>{reportStatuses[booking.status].label}</span></td><td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-800">{reportMoney(booking.amount, booking.currency)}</td></tr>)}{!data.bookings.length && <tr><td colSpan={6} className="p-8 text-center text-slate-400">ไม่พบรายการจอง</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-slate-500"><span>หน้า {data.pagination.page} / {data.pagination.totalPages} • {reportNumber(data.pagination.total)} รายการ</span><div className="flex gap-2"><button className={button} disabled={data.pagination.page <= 1} onClick={() => navigate({ page: String(data.pagination.page - 1) })}>ก่อนหน้า</button><button className={button} disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => navigate({ page: String(data.pagination.page + 1) })}>ถัดไป</button></div></div></section>
      <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-[10px] leading-5 text-slate-400"><span>FUNCH • Car Booking Analytics & Financial Report</span><span>อัปเดต {dateTimeLabel(data.generatedAt)} • {data.timeZone}</span></footer>
    </>}
  </div>;
}
