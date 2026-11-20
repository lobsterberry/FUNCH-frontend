"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Country } from "@/lib/rental";
import { ApiError } from "@/lib/account";
import { adminRequest } from "@/lib/cars-management";
import type {
  CarsCatalogData,
  CarModel,
  CarOffer,
  CarUnit,
  InventoryInput,
  InventoryMutation,
  VehicleStatus,
} from "@/lib/cars";
import {
  emptyCarsFilters,
  carsCsv,
  carsResults,
  inventoryStatusLabels,
  type CarsFilters as Filters,
} from "@/lib/cars-view";
import { CarForm } from "./car-form";
import { CarSchedule } from "./car-schedule";
import { ModelForm } from "./model-form";
import { OfferForm } from "./offer-form";
import { TransferVehicleForm } from "./transfer-vehicle-form";
import { CarsOverview } from "./cars-overview";
import { CarsFilters, type CarsView } from "./cars-filters";
import { CarsModelView } from "./cars-model-view";
import { CarsLocationView } from "./cars-location-view";
import { CarsUnitTable } from "./cars-unit-table";
import { AdminIcon } from "../layout/admin-icon";
import { Dialog } from "@/components/shared/dialog";
import { useCarsManagement } from "../layout/cars-management-context";

type Modal =
  | { kind: "model"; item: CarModel | null }
  | {
      kind: "offer";
      item: CarOffer | null;
      modelId?: string;
      locationId?: string;
    }
  | {
      kind: "car";
      item: CarUnit | null;
      modelId?: string;
      locationId?: string;
      offerId?: string;
    }
  | { kind: "transfer"; unitId?: string }
  | { kind: "history" | "status"; unit: CarUnit };
const emptyCatalog: CarsCatalogData = {
  models: [],
  offers: [],
  units: [],
  locationInventory: [],
  generatedAt: "",
  summary: {
    models: 0,
    locations: 0,
    countries: 0,
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
  },
};

function StatusForm({
  unit,
  onClose,
  onSave,
}: {
  unit: CarUnit;
  onClose: () => void;
  onSave: (input: InventoryInput) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const status = String(
      new FormData(event.currentTarget).get("status"),
    ) as VehicleStatus;
    setBusy(true);
    setError("");
    try {
      await onSave({
        carModelLocationId: unit.carModelLocationId!,
        year: unit.year,
        licensePlate: unit.licensePlate!,
        isAvailable: status === "AVAILABLE",
        operationalStatus: status,
      });
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={`จัดการสถานะ · ${unit.licensePlate}`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-slate-500">
          {unit.name} · {unit.location?.nameTh || "ยังไม่จัดสาขา"}
        </p>
        <label className="block text-xs font-medium">
          สถานะการปฏิบัติงาน
          <select
            disabled={busy}
            name="status"
            defaultValue={unit.operationalStatus}
            className="form-input mt-2"
          >
            {(
              ["AVAILABLE", "CLEANING", "MAINTENANCE", "INACTIVE"] as const
            ).map((status) => (
              <option key={status} value={status}>
                {inventoryStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">
          รถที่เตรียมรถ ซ่อมบำรุง หรือปิดบริการ จะไม่ถูกจัดสรรให้รายการจองใหม่
          หากมีรายการจองค้างต้องจัดการตารางก่อน
          การเปิดบริการยังต้องรอให้พ้นเวลาเตรียมรถหลังคืน
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-xs"
          >
            ยกเลิก
          </button>
          <button disabled={busy} className="btn-primary px-4 py-2 text-xs">
            {busy ? "กำลังบันทึก…" : "ยืนยันสถานะ"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function CarsManagement() {
  const router = useRouter();
  const { setNetwork } = useCarsManagement();
  const params = useSearchParams();
  const [data, setData] = useState<CarsCatalogData>(emptyCatalog);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<Modal | null>(null);
  const requestId = useRef(0);
  const filters = Object.fromEntries(
    Object.entries(emptyCarsFilters).map(([key, value]) => [
      key,
      params.get(key) || value,
    ]),
  ) as Filters;
  const view: CarsView =
    params.get("view") === "location"
      ? "location"
      : params.get("view") === "inventory"
        ? "inventory"
        : "model";
  const pageSize = view === "model" ? 5 : view === "location" ? 6 : 10;
  const results = carsResults(data, filters);
  const noLocationFilter =
    !filters.search &&
    filters.category === "all" &&
    filters.status === "all" &&
    filters.model === "all";
  const locationIds = new Set<string>([
    ...results.offers.map((offer) => offer.locationId),
    ...results.units.flatMap((unit) =>
      unit.locationId ? [unit.locationId] : [],
    ),
  ]);
  if (noLocationFilter)
    for (const country of countries)
      for (const location of country.locations || []) {
        if (
          (filters.country === "all" || country.code === filters.country) &&
          (filters.location === "all" || location.id === filters.location)
        )
          locationIds.add(location.id);
      }
  const allLocations = countries
    .flatMap((country) => country.locations || [])
    .filter((location) => locationIds.has(location.id));
  const counts = {
    model: results.models.length,
    location: allLocations.length,
    inventory: results.units.length,
  };
  const count = counts[view];
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const rawPage = Number(params.get("page")) || 1;
  const page = Math.max(
    1,
    Math.min(Number.isFinite(rawPage) ? Math.floor(rawPage) : 1, totalPages),
  );
  const start = (page - 1) * pageSize;
  const pagedLocations = new Set(
    allLocations.slice(start, start + pageSize).map((location) => location.id),
  );
  const ungrouped = results.units.filter((unit) => !unit.carModelId);

  const authorize = useCallback(
    (cause: unknown) => {
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
        router.replace("/admin/login");
        router.refresh();
      }
    },
    [router],
  );
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [catalog, countryList] = await Promise.all([
        adminRequest<{ data: CarsCatalogData }>("/api/cars/catalog"),
        adminRequest<{ data: Country[] }>("/api/countries"),
      ]);
      if (id !== requestId.current) return;
      setData(catalog.data);
      setCountries(countryList.data);
      setError("");
      setLoaded(true);
      const activeCountries = new Set(
        catalog.data.offers
          .filter((offer) => offer.isActive)
          .map((offer) => offer.location.countryCode),
      );
      setNetwork({
        summary: catalog.data.summary,
        countries: countryList.data.filter((country) =>
          activeCountries.has(country.code),
        ),
      });
    } catch (cause) {
      if (id === requestId.current) {
        authorize(cause);
        setError((cause as Error).message);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [authorize, setNetwork]);
  useEffect(() => {
    const requests = requestId;
    const timer = setTimeout(() => void load(), 0);
    return () => {
      clearTimeout(timer);
      requests.current++;
    };
  }, [load]);

  function navigate(change: Record<string, string>, push = false) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(change)) {
      if (value === "all" || value === "" || (key === "page" && value === "1"))
        next.delete(key);
      else next.set(key, value);
    }
    const url = `/admin/cars${next.size ? `?${next}` : ""}`;
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }
  async function mutate(path: string, method: string, body: unknown) {
    try {
      await adminRequest(path, method, body);
    } catch (cause) {
      authorize(cause);
      throw cause;
    }
    setModal(null);
    setNotice("บันทึกข้อมูลเรียบร้อยแล้ว");
    await load();
  }
  async function saveInventory(body: InventoryMutation) {
    const item = modal?.kind === "car" ? modal.item : null;
    await mutate(
      item
        ? `/api/cars/${encodeURIComponent(item.id)}`
        : "licensePlates" in body
          ? "/api/cars/bulk"
          : "/api/cars",
      item ? "PATCH" : "POST",
      body,
    );
  }
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([carsCsv(results.units)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "funch-cars.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const actions = {
    onEdit: (unit: CarUnit) => setModal({ kind: "car", item: unit }),
    onHistory: (unit: CarUnit) => setModal({ kind: "history", unit }),
    onTransfer: (unit: CarUnit) =>
      setModal({ kind: "transfer", unitId: unit.id }),
    onStatus: (unit: CarUnit) =>
      setModal(
        unit.carModelLocationId
          ? { kind: "status", unit }
          : { kind: "car", item: unit },
      ),
  };
  const disabled = loading || !!error;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-medium">
            <span className="tracking-widest text-blue-600">
              CAR MANAGEMENT
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
              Cars Across Locations
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            ระบบจัดการรุ่นรถและฝูงรถยนต์
          </h1>
          <p className="mt-1.5 text-xs leading-6 text-slate-500">
            จัดการสเปกรุ่นรถ บริการรายสาขา และทะเบียนรถจริงทั้งหมดในที่เดียว
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <button
            disabled={disabled || !data.units.length}
            onClick={() => setModal({ kind: "transfer" })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <AdminIcon name="transfer" className="h-4 w-4 text-indigo-600" />
            ย้ายรถข้ามสาขา
          </button>
          <button
            disabled={disabled || !data.offers.length}
            onClick={() => setModal({ kind: "car", item: null })}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 font-medium text-blue-700 hover:bg-blue-100"
          >
            <AdminIcon name="plus" className="h-4 w-4" />
            เพิ่มรถลงสาขา
          </button>
          <button
            disabled={disabled || !data.models.length}
            onClick={() => setModal({ kind: "offer", item: null })}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 font-medium text-emerald-800 hover:bg-emerald-100"
          >
            <AdminIcon name="settings" className="h-4 w-4" />
            ตั้งค่าราคาเช่ารถ
          </button>
          <button
            disabled={disabled}
            onClick={() => setModal({ kind: "model", item: null })}
            className="btn-primary flex items-center gap-1.5 px-3 py-2.5 shadow-sm"
          >
            <AdminIcon name="plus" className="h-4 w-4" />
            เพิ่มรุ่นรถใหม่
          </button>
        </div>
      </div>
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="ปิดข้อความสำเร็จ"
            className="px-2"
          >
            ×
          </button>
        </div>
      )}
      <CarsOverview
        summary={loaded && !error ? data.summary : undefined}
        loading={loading}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-linear-to-r from-blue-900 to-indigo-900 p-5 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-600 bg-blue-800/70">
            <AdminIcon name="models" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              สร้างรุ่นครั้งเดียว จัดการรถได้หลายสาขา
            </h2>
            <p className="mt-1 text-[11px] leading-6 text-blue-200">
              กำหนดสเปกร่วมให้รุ่นรถ ตั้งราคาแยกตามสาขา
              แล้วเพิ่มทะเบียนและดูสถานะของรถแต่ละคัน
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-700 bg-blue-950/40 px-4 py-3 text-xs font-medium">
          <span className="text-emerald-300">รุ่นรถ</span>
          <span aria-hidden="true" className="text-blue-400">
            →
          </span>
          <span className="text-amber-200">สาขาและราคา</span>
          <span aria-hidden="true" className="text-blue-400">
            →
          </span>
          <span className="text-cyan-200">รถรายคัน</span>
        </div>
      </div>
      <CarsFilters
        filters={filters}
        countries={countries}
        view={view}
        counts={counts}
        onChange={(change) => navigate({ ...change, page: "1" })}
        onView={(next) => navigate({ view: next, page: "1" }, true)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">
          {view === "model"
            ? "รุ่นรถและสาขาที่ให้บริการ"
            : view === "location"
              ? "ภาพรวมรถยนต์ตามสาขา"
              : "รายการคันรถจริงทั้งหมด"}
          <span className="ml-2 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-normal text-slate-500">
            {count}{" "}
            {view === "model" ? "รุ่น" : view === "location" ? "สาขา" : "คัน"}
          </span>
        </h2>
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="text-blue-600 hover:underline"
          >
            {loading ? "กำลังโหลด…" : "↻ โหลดข้อมูลใหม่"}
          </button>
          {view === "inventory" && (
            <button
              disabled={disabled || !results.units.length}
              onClick={exportCsv}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50"
            >
              ↓ ส่งออก CSV
            </button>
          )}
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          {error}
          <button onClick={() => void load()} className="ml-3 underline">
            ลองอีกครั้ง
          </button>
        </div>
      )}
      {!loaded && loading && (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400"
        >
          กำลังโหลดรุ่นรถ สาขา และทะเบียนรถ…
        </div>
      )}
      {(["model", "location", "inventory"] as const).map((panel) => (
        <div
          key={panel}
          id={`cars-panel-${panel}`}
          role="tabpanel"
          aria-labelledby={`cars-tab-${panel}`}
          tabIndex={0}
          hidden={view !== panel}
          aria-busy={loading}
        >
          {loaded && !error && view === panel && (
            <>
              {count === 0 && !(panel === "model" && ungrouped.length) ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <AdminIcon
                    name="car"
                    className="mx-auto h-10 w-10 text-slate-300"
                  />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    {data.models.length || data.units.length
                      ? "ไม่พบข้อมูลที่ตรงกับตัวกรอง"
                      : "เริ่มต้นจัดการฝูงรถของคุณ"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {data.models.length || data.units.length
                      ? "ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง"
                      : "เพิ่มรุ่นรถ เปิดบริการในสาขา แล้วเพิ่มทะเบียนรถจริง"}
                  </p>
                </div>
              ) : panel === "model" ? (
                <>
                  <CarsModelView
                    models={results.models.slice(start, start + pageSize)}
                    offers={results.offers}
                    units={results.units}
                    countries={countries}
                    onModel={(item) => setModal({ kind: "model", item })}
                    onOffer={(modelId, item, locationId) =>
                      setModal({
                        kind: "offer",
                        item: item || null,
                        modelId,
                        locationId,
                      })
                    }
                    onAdd={(context) =>
                      setModal({ kind: "car", item: null, ...context })
                    }
                    {...actions}
                  />
                  {!!ungrouped.length && (
                    <section className="mt-5 overflow-hidden rounded-2xl border border-amber-200 bg-white">
                      <h3 className="border-b border-amber-100 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                        รถที่ยังไม่จัดกลุ่ม ({ungrouped.length} คัน)
                      </h3>
                      <CarsUnitTable units={ungrouped} {...actions} />
                    </section>
                  )}
                </>
              ) : panel === "location" ? (
                <CarsLocationView
                  countries={countries}
                  locationIds={pagedLocations}
                  offers={results.offers}
                  units={results.units}
                  onManage={(location, model) =>
                    navigate(
                      {
                        view: "model",
                        location,
                        model: model || "all",
                        page: "1",
                      },
                      true,
                    )
                  }
                  onOffer={(locationId) =>
                    setModal({ kind: "offer", item: null, locationId })
                  }
                />
              ) : (
                <section
                  aria-label="ตารางทะเบียนรถ"
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <CarsUnitTable
                    units={results.units.slice(start, start + pageSize)}
                    {...actions}
                  />
                </section>
              )}
            </>
          )}
        </div>
      ))}
      {loaded && !error && count > 0 && (
        <nav
          aria-label="แบ่งหน้าผลลัพธ์"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-500"
        >
          <p>
            แสดง {start + 1}–{Math.min(start + pageSize, count)} จาก {count}{" "}
            {view === "model" ? "รุ่น" : view === "location" ? "สาขา" : "คัน"}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => navigate({ page: String(page - 1) }, true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5"
            >
              ย้อนกลับ
            </button>
            <span
              aria-current="page"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-white"
            >
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => navigate({ page: String(page + 1) }, true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5"
            >
              ถัดไป
            </button>
          </div>
        </nav>
      )}
      <p className="text-[10px] leading-5 text-slate-400">
        อัตราค่าเช่าเป็น THB · จำนวนรถนับตามตำแหน่งปัจจุบัน ·
        ความว่างตามช่วงวันเช่าตรวจสอบอีกครั้งเมื่อจอง ·
        ภาพรวมด้านบนเป็นยอดทั้งระบบ
      </p>
      {modal?.kind === "model" && (
        <ModelForm
          model={modal.item}
          onClose={() => setModal(null)}
          onSave={(body) =>
            mutate(
              `/api/cars/models${modal.item ? `/${encodeURIComponent(modal.item.id)}` : ""}`,
              modal.item ? "PATCH" : "POST",
              body,
            )
          }
        />
      )}
      {modal?.kind === "offer" && (
        <OfferForm
          offer={modal.item}
          initialModelId={modal.modelId}
          initialLocationId={modal.locationId}
          models={data.models}
          countries={countries}
          onClose={() => setModal(null)}
          onSave={(body) =>
            mutate(
              `/api/cars/offers${modal.item ? `/${encodeURIComponent(modal.item.id)}` : ""}`,
              modal.item ? "PATCH" : "POST",
              body,
            )
          }
        />
      )}
      {modal?.kind === "car" && (
        <CarForm
          car={modal.item}
          catalog={data}
          initialModelId={modal.modelId}
          initialLocationId={modal.locationId}
          initialOfferId={modal.offerId}
          onClose={() => setModal(null)}
          onSave={saveInventory}
        />
      )}
      {modal?.kind === "transfer" && (
        <TransferVehicleForm
          units={data.units}
          offers={data.offers}
          initialUnitId={modal.unitId}
          onClose={() => setModal(null)}
          onSave={(unit, body) =>
            mutate(
              `/api/cars/${encodeURIComponent(unit.id)}`,
              "PATCH",
              body,
            )
          }
        />
      )}
      {modal?.kind === "history" && (
        <CarSchedule
          car={modal.unit}
          onClose={() => setModal(null)}
          onChanged={() => void load()}
        />
      )}
      {modal?.kind === "status" && (
        <StatusForm
          unit={modal.unit}
          onClose={() => setModal(null)}
          onSave={(body) =>
            mutate(
              `/api/cars/${encodeURIComponent(modal.unit.id)}`,
              "PATCH",
              body,
            )
          }
        />
      )}
    </div>
  );
}
