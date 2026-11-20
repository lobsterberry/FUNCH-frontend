"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCountry,
  resolveLocation,
  locationLabel,
  type Car,
  type Country,
  type SearchCriteria,
} from "@/lib/rental";
import { HomeContent } from "./home-content";
import { Header, Footer } from "./layout/site-header-footer";
import { useSiteAccount } from "./layout/site-account";
import { SearchResults } from "./search-results";
import { CarDetails } from "./rental-dialog";
import { Dialog } from "@/components/shared/dialog";
import { BookingDialog } from "./booking-dialog";
import { SearchForm } from "./search-form";
import { bookingInstant } from "@/lib/booking-time";

function readSearch(params: URLSearchParams, countries: Country[]) {
  const countryCode = params.get("country") || "";
  const country = getCountry(countryCode, countries);
  const locations = country?.locations ?? [];
  const locationId = params.get("locationId") || undefined;
  const dropoffLocationId = params.get("dropoffLocationId") || undefined;
  const location = params.get("location") || "";
  const returnLocation = params.get("return_location") || undefined;
  const pickup = resolveLocation(locations, locationId, location);
  const dropoff = resolveLocation(locations, dropoffLocationId, returnLocation);
  const criteria: SearchCriteria = {
    country: countryCode,
    locationId: pickup?.id ?? locationId,
    dropoffLocationId: dropoff?.id ?? dropoffLocationId,
    location: pickup ? locationLabel(pickup) : location,
    return_location: dropoff ? locationLabel(dropoff) : returnLocation,
    pickup_date: params.get("pickup_date") || "",
    pickup_time: params.get("pickup_time") || "",
    return_date: params.get("return_date") || "",
    return_time: params.get("return_time") || "",
    service: params.get("service") || undefined,
  };
  return { criteria, country, pickup, dropoff };
}

export default function RentalApp({ mode }: { mode: "home" | "search" }) {
  const params = useSearchParams();
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [inventory, setInventory] = useState<{
    key: string;
    cars: Car[];
    error: string;
  }>({ key: "", cars: [], error: "" });
  const [countryError, setCountryError] = useState("");
  const [refreshInventory, setRefreshInventory] = useState(0);
  const searchKey = params.toString();
  const { criteria, country, pickup, dropoff } = useMemo(
    () =>
      readSearch(
        new URLSearchParams(mode === "search" ? searchKey : ""),
        countries ?? [],
      ),
    [countries, mode, searchKey],
  );
  const requestKey = `${mode}|${searchKey}|${refreshInventory}`;
  const hasInventory = inventory.key.startsWith(`${mode}|${searchKey}|`);
  const cars = hasInventory ? inventory.cars : [];
  const { member, updateMember, sessionLoading, accountError, loggingOut, logout } =
    useSiteAccount();
  const [details, setDetails] = useState<Car | null>(null);
  const [booking, setBooking] = useState<Car | null>(null);
  const [auth, setAuth] = useState<"login" | "register" | null>(null);
  const [editing, setEditing] = useState<SearchCriteria | null>(null);

  useEffect(() => {
    if (mode === "home" && typeof window !== "undefined" && !window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, [mode]);

  useEffect(() => {
    let active = true;
    fetch("/api/countries", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("โหลดข้อมูลสาขาไม่สำเร็จ");
        return response.json();
      })
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
    if (countries === null) return;
    const controller = new AbortController();
    async function search() {
      try {
        const query = new URLSearchParams();
        if (mode === "search") {
          if (criteria.country && criteria.country !== "all" && !country) {
            throw new Error("ไม่พบประเทศที่เลือก กรุณาเลือกประเทศจากรายการค้นหา");
          }
          if (
            ((criteria.locationId || criteria.location) && !pickup) ||
            ((criteria.dropoffLocationId || criteria.return_location) && !dropoff)
          ) {
            throw new Error("กรุณาเลือกสาขารับและคืนรถจากรายการค้นหา");
          }
          if (country) query.set("country", country.code);
          if (pickup) query.set("locationId", pickup.id);
          if (dropoff) query.set("dropoffLocationId", dropoff.id);

          const { pickup_date, pickup_time, return_date, return_time } = criteria;
          const dateFields = [pickup_date, pickup_time, return_date, return_time];
          if (dateFields.some(Boolean)) {
            if (!dateFields.every(Boolean))
              throw new Error("กรุณาระบุวันและเวลารับรถและคืนรถให้ครบถ้วน");
            if (!pickup) throw new Error("กรุณาเลือกสาขารับรถจากรายการค้นหา");
            const returnBranch = dropoff ?? pickup;
            const start = bookingInstant(pickup_date, pickup_time, pickup.timeZone);
            const end = bookingInstant(
              return_date,
              return_time,
              returnBranch.timeZone,
            );
            if (end <= start) throw new Error("เวลาคืนรถต้องหลังเวลารับรถ");
            query.set("dropoffLocationId", returnBranch.id);
            query.set("startDateTime", start);
            query.set("endDateTime", end);
          }
        }
        const response = await fetch(`/api/cars/search?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error("ค้นหารถว่างไม่สำเร็จ กรุณาลองอีกครั้ง");
        if (!controller.signal.aborted)
          setInventory({ key: requestKey, cars: result.data, error: "" });
      } catch (cause) {
        if (!controller.signal.aborted)
          setInventory({ key: requestKey, cars: [], error: (cause as Error).message });
      }
    }
    void search();
    return () => controller.abort();
  }, [countries, mode, requestKey, criteria, country, pickup, dropoff]);

  const countryList = countries ?? [];
  return (
    <>
      <Header
        page={mode}
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
          {mode === "search" && countryList.length > 0 && (
            <button
              onClick={() => setEditing(criteria)}
              className="btn-primary mt-4 px-4 py-2"
            >
              แก้ไขการค้นหา
            </button>
          )}
        </main>
      ) : !hasInventory ? (
        <main className="p-12 text-center" role="status">
          กำลังโหลดข้อมูลรถ…
        </main>
      ) : mode === "home" ? (
        <HomeContent
          countries={countryList}
          cars={cars}
          criteria={criteria}
          onDetails={setDetails}
          onBook={setBooking}
        />
      ) : (
        <SearchResults
          key={searchKey}
          countries={countryList}
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
          country={getCountry(details.country, countryList)}
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
          countries={countryList}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={updateMember}
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
          countries={countryList}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={updateMember}
          onClose={() => setAuth(null)}
        />
      )}{" "}
      {editing && (
        <Dialog wide title="แก้ไขการค้นหา" onClose={() => setEditing(null)}>
          <SearchForm
            countries={countryList}
            initial={editing}
            onComplete={() => setEditing(null)}
          />
        </Dialog>
      )}
    </>
  );
}
