"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  defaultCriteria,
  getCountry,
  resolveLocation,
  locationLabel,
  type Car,
  type Country,
  type SearchCriteria,
} from "@/lib/rental";
import { HomeContent } from "./home-content";
import { Header, Footer } from "./layout/site-header-footer";
import { SearchResults } from "./search-results";
import { CarDetails } from "./rental-dialog";
import { Dialog } from "@/components/shared/dialog";
import { BookingDialog } from "./booking-dialog";
import { currentMember, signOut, type Member } from "@/lib/account";
import { SearchForm } from "./search-form";
import { bookingInstant } from "@/lib/booking-time";

export default function RentalApp({ mode }: { mode: "home" | "search" }) {
  const params = useSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);
  const [inventory, setInventory] = useState<{
    key: string;
    cars: Car[];
    error: string;
  }>({ key: "", cars: [], error: "" });
  const [countryError, setCountryError] = useState("");
  const [refreshInventory, setRefreshInventory] = useState(0);
  const searchKey = params.toString();
  const requestKey = `${mode}|${searchKey}|${refreshInventory}`;
  const hasInventory = inventory.key.startsWith(`${mode}|${searchKey}|`);
  const cars = hasInventory ? inventory.cars : [];
  const [member, setMember] = useState<Member | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accountError, setAccountError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [details, setDetails] = useState<Car | null>(null);
  const [booking, setBooking] = useState<Car | null>(null);
  const [auth, setAuth] = useState<"login" | "register" | null>(null);
  const [editing, setEditing] = useState<SearchCriteria | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      currentMember()
        .then((value) => {
          if (active) {
            setMember(value);
            setAccountError("");
          }
        })
        .catch(() => {
          if (active)
            setAccountError("ตรวจสอบบัญชีไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
        })
        .finally(() => {
          if (active) setSessionLoading(false);
        });
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    setAccountError("");
    try {
      await signOut();
      setMember(null);
    } catch (cause) {
      setAccountError((cause as Error).message);
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/countries", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result.success || !Array.isArray(result.data))
          throw new Error("โหลดข้อมูลสาขาไม่สำเร็จ");
        if (active) setCountries(result.data);
      })
      .catch(() => {
        if (active)
          setCountryError("โหลดข้อมูลสาขาไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!countries.length) return;
    const controller = new AbortController();
    const key = `${mode}|${searchKey}|${refreshInventory}`;
    async function search() {
      try {
        const query = new URLSearchParams();
        if (mode === "search") {
          const url = new URLSearchParams(searchKey);
          const selectedCountry = getCountry(
            url.get("country") || "TH",
            countries,
          );
          const locations = selectedCountry.locations || [];
          const pickup = resolveLocation(
            locations,
            url.get("locationId") || undefined,
            url.get("location") || selectedCountry.location,
          );
          const dropoff =
            url.get("dropoffLocationId") || url.get("return_location")
              ? resolveLocation(
                  locations,
                  url.get("dropoffLocationId") || undefined,
                  url.get("return_location") || undefined,
                )
              : pickup;
          if (!pickup || !dropoff)
            throw new Error("กรุณาเลือกสาขารับและคืนรถจากรายการค้นหา");
          const start = bookingInstant(
            url.get("pickup_date") || defaultCriteria.pickup_date,
            url.get("pickup_time") || defaultCriteria.pickup_time,
            pickup.timeZone,
          );
          const end = bookingInstant(
            url.get("return_date") || defaultCriteria.return_date,
            url.get("return_time") || defaultCriteria.return_time,
            dropoff.timeZone,
          );
          if (end <= start) throw new Error("เวลาคืนรถต้องหลังเวลารับรถ");
          query.set("country", selectedCountry.code);
          query.set("locationId", pickup.id);
          query.set("dropoffLocationId", dropoff.id);
          query.set("startDateTime", start);
          query.set("endDateTime", end);
        }
        const response = await fetch(`/api/cars/search?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error("ค้นหารถว่างไม่สำเร็จ กรุณาลองอีกครั้ง");
        if (!controller.signal.aborted)
          setInventory({ key, cars: result.data, error: "" });
      } catch (cause) {
        if (!controller.signal.aborted)
          setInventory({ key, cars: [], error: (cause as Error).message });
      }
    }
    void search();
    return () => controller.abort();
  }, [countries, mode, searchKey, refreshInventory]);

  const rawCountry = params.get("country");
  const country =
    rawCountry === "all" || countries.some((item) => item.code === rawCountry)
      ? rawCountry!
      : (countries[0]?.code ?? "TH");
  const defaultLoc =
    getCountry(country, countries)?.location ?? defaultCriteria.location;
  const selectedLocations = getCountry(country, countries).locations || [];
  const criteriaPickup = resolveLocation(
    selectedLocations,
    params.get("locationId") || undefined,
    params.get("location") || defaultLoc,
  );
  const criteriaDropoff = resolveLocation(
    selectedLocations,
    params.get("dropoffLocationId") || undefined,
    params.get("return_location") || undefined,
  );
  const criteria: SearchCriteria =
    mode === "home"
      ? defaultCriteria
      : {
          country,
          locationId: params.get("locationId") || undefined,
          dropoffLocationId: params.get("dropoffLocationId") || undefined,
          location: criteriaPickup
            ? locationLabel(criteriaPickup)
            : params.get("location") || defaultLoc,
          pickup_date: params.get("pickup_date") ?? defaultCriteria.pickup_date,
          pickup_time: params.get("pickup_time") ?? defaultCriteria.pickup_time,
          return_date: params.get("return_date") ?? defaultCriteria.return_date,
          return_time: params.get("return_time") ?? defaultCriteria.return_time,
          return_location: criteriaDropoff
            ? locationLabel(criteriaDropoff)
            : (params.get("return_location") ?? undefined),
          service: "self-drive",
        };
  return (
    <>
      <Header
        search={mode === "search"}
        onAuth={setAuth}
        member={member}
        sessionLoading={sessionLoading}
        loggingOut={loggingOut}
        onLogout={logout}
      />
      {accountError && (
        <p
          role="alert"
          className="bg-rose-50 px-4 py-2 text-center text-sm text-rose-700"
        >
          {accountError}
        </p>
      )}
      {countryError || (inventory.key === requestKey && inventory.error) ? (
        <main className="p-8 text-center">
          <p role="alert" className="text-rose-700">
            {countryError || inventory.error}
          </p>
          <button
            onClick={() => setEditing(criteria)}
            className="btn-primary mt-4 px-4 py-2"
          >
            แก้ไขการค้นหา
          </button>
        </main>
      ) : !hasInventory ? (
        <main className="p-12 text-center" role="status">
          กำลังค้นหารถว่าง…
        </main>
      ) : mode === "home" ? (
        <HomeContent
          countries={countries}
          cars={cars}
          onDetails={setDetails}
          onBook={setBooking}
        />
      ) : (
        <SearchResults
          key={`${params.toString()}|${countries.length}`}
          countries={countries}
          cars={cars}
          criteria={criteria}
          onDetails={setDetails}
          onBook={setBooking}
          onEdit={setEditing}
        />
      )}
      <Footer />
      {details && (
        <CarDetails
          car={details}
          onClose={() => setDetails(null)}
          onBook={(car) => {
            setDetails(null);
            setBooking(car);
          }}
        />
      )}{" "}
      {booking && (
        <BookingDialog
          car={booking}
          criteria={criteria}
          countries={countries}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={setMember}
          onClose={() => {
            setBooking(null);
            setRefreshInventory((value) => value + 1);
          }}
        />
      )}{" "}
      {auth && (
        <BookingDialog
          authOnly
          initialTab={auth}
          criteria={criteria}
          countries={countries}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={setMember}
          onClose={() => setAuth(null)}
        />
      )}{" "}
      {editing && (
        <Dialog wide title="แก้ไขการค้นหา" onClose={() => setEditing(null)}>
          <SearchForm
            countries={countries}
            initial={editing}
            onComplete={() => setEditing(null)}
          />
        </Dialog>
      )}
    </>
  );
}
