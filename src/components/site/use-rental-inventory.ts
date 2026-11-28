import { useEffect, useState } from "react";
import type { Car, Country } from "@/lib/rental";

export function useRentalCountries() {
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadCountries() {
      try {
        const response = await fetch("/api/countries", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (!result.success || !Array.isArray(result.data)) throw new Error();
        if (!controller.signal.aborted) setCountries(result.data);
      } catch {
        if (!controller.signal.aborted) {
          setError("โหลดข้อมูลสาขาไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
        }
      }
    }
    void loadCountries();
    return () => controller.abort();
  }, []);

  return { countries, error };
}

export function useRentalInventory(searchKey: string, query: string | null) {
  const [inventory, setInventory] = useState<{
    searchKey: string;
    revision: number;
    cars: Car[];
    error: string;
  } | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (query === null) return;
    const controller = new AbortController();
    const requestUrl = `/api/cars/search?${query}`;

    async function loadCars() {
      try {
        const response = await fetch(requestUrl, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error("ค้นหารถว่างไม่สำเร็จ กรุณาลองอีกครั้ง");
        }
        if (!controller.signal.aborted) {
          setInventory({ searchKey, revision, cars: result.data, error: "" });
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setInventory({
            searchKey,
            revision,
            cars: [],
            error: (cause as Error).message,
          });
        }
      }
    }
    void loadCars();
    return () => controller.abort();
  }, [query, searchKey, revision]);

  // Keep the same search results visible during a refresh after closing a booking.
  const currentInventory = inventory?.searchKey === searchKey ? inventory : null;
  return {
    cars: currentInventory?.cars ?? [],
    loading: currentInventory === null,
    error: currentInventory?.revision === revision ? currentInventory.error : "",
    refresh: () => setRevision((value) => value + 1),
  };
}
