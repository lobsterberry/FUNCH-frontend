"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { carCategories, featureOptions } from "@/lib/cars-management";
import type { CarModel } from "@/lib/cars";
import { Dialog } from "@/components/shared/dialog";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-700">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

export function ModelForm({
  model,
  onClose,
  onSave,
}: {
  model: CarModel | null;
  onClose: () => void;
  onSave: (body: unknown) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const features = {
    ...featureOptions,
    ...Object.fromEntries(
      (model?.options || []).map((option) => [option.code, option.label]),
    ),
    ...Object.fromEntries(
      (model?.featureCodes || [])
        .filter(
          (code) =>
            !(code in featureOptions) &&
            !model?.options?.some((option) => option.code === code),
        )
        .map((code) => [code, code]),
    ),
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) || "").trim();
    const categories = form.getAll("categories").map(String);
    if (!categories.length) {
      setError("เลือกประเภทรถอย่างน้อย 1 ประเภท");
      return;
    }
    const featureCodes = form.getAll("features").map(String);
    setBusy(true);
    setError("");
    try {
      await onSave({
        brand: text("brand"),
        model: text("model"),
        year: Number(text("year")),
        seats: Number(text("seats")),
        luggageCapacity: Number(text("luggageCapacity")),
        transmission: text("transmission"),
        transmissionType: text("transmissionType"),
        fuelType: text("fuelType"),
        steeringSide: text("steeringSide"),
        categories,
        categoryLabel: text("categoryLabel"),
        description: text("description"),
        imageUrl: text("imageUrl") || null,
        featureCodes,
        options: featureCodes.map((code) => ({
          code,
          label: features[code as keyof typeof features] || code,
          included:
            model?.options?.find((option) => option.code === code)?.included ??
            true,
        })),
      });
    } catch (cause) {
      setError((cause as Error).message);
      setBusy(false);
    }
  }
  return (
    <Dialog
      wide
      title={model ? "แก้ไขรุ่นรถ" : "เพิ่มรุ่นรถ"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <p className="text-sm text-slate-500">
            ข้อมูลนี้ใช้ร่วมกันทุกคันในรุ่นนี้ แยกรุ่นย่อย ปี
            และฝั่งพวงมาลัยให้ตรงกับรถที่ให้เช่า
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="ยี่ห้อ *">
              <input
                required
                name="brand"
                maxLength={100}
                defaultValue={model?.brand}
                className="form-input"
              />
            </Field>
            <Field label="รุ่น / รุ่นย่อย *">
              <input
                required
                name="model"
                maxLength={150}
                defaultValue={model?.model}
                className="form-input"
              />
            </Field>
            <Field label="ปี *">
              <input
                required
                name="year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={model?.year || 2026}
                className="form-input"
              />
            </Field>
            <Field label="จำนวนที่นั่ง *">
              <input
                required
                name="seats"
                type="number"
                min={1}
                max={60}
                defaultValue={model?.seats || 5}
                className="form-input"
              />
            </Field>
            <Field label="จำนวนกระเป๋า *">
              <input
                required
                name="luggageCapacity"
                type="number"
                min={0}
                max={60}
                defaultValue={model?.luggageCapacity ?? 2}
                className="form-input"
              />
            </Field>
            <Field label="พวงมาลัย">
              <select
                name="steeringSide"
                defaultValue={model?.steeringSide || "RHD"}
                className="form-input"
              >
                <option value="RHD">ขวา (RHD)</option>
                <option value="LHD">ซ้าย (LHD)</option>
              </select>
            </Field>
            <Field label="ประเภทเกียร์">
              <select
                name="transmissionType"
                defaultValue={model?.transmissionType || "AUTOMATIC"}
                className="form-input"
              >
                <option value="AUTOMATIC">อัตโนมัติ</option>
                <option value="MANUAL">ธรรมดา</option>
              </select>
            </Field>
            <Field label="ชื่อระบบส่งกำลัง *">
              <input
                required
                name="transmission"
                maxLength={50}
                defaultValue={model?.transmission || "Automatic"}
                className="form-input"
              />
            </Field>
            <Field label="เชื้อเพลิง">
              <select
                name="fuelType"
                defaultValue={model?.fuelType || "Gasoline"}
                className="form-input"
              >
                {["Gasoline", "Diesel", "Hybrid", "EV"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-3">
            {carCategories.map((category) => (
              <label key={category} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="categories"
                  value={category}
                  defaultChecked={
                    model?.categories.includes(category) ?? category === "SEDAN"
                  }
                />
                {category}
              </label>
            ))}
          </div>
          <Field label="ชื่อประเภทที่แสดง *">
            <input
              required
              name="categoryLabel"
              maxLength={100}
              defaultValue={model?.categoryLabel || "Sedan"}
              className="form-input"
            />
          </Field>
          <Field label="คำอธิบาย">
            <textarea
              name="description"
              maxLength={4000}
              defaultValue={model?.description || ""}
              className="form-input"
            />
          </Field>
          <Field label="URL รูปภาพ">
            <input
              name="imageUrl"
              type="url"
              maxLength={2000}
              defaultValue={model?.imageUrl || ""}
              className="form-input"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(features).map(([code, label]) => (
              <label key={code} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="features"
                  value={code}
                  defaultChecked={model?.featureCodes.includes(code)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            ยกเลิก
          </button>
          <button disabled={busy} className="btn-primary px-4 py-2 text-sm">
            {busy ? "กำลังบันทึก…" : "บันทึกรุ่นรถ"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
