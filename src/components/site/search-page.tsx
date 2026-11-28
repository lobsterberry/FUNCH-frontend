"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dialog } from "@/components/shared/dialog";
import { bookingInstant } from "@/lib/booking-time";
import {
  getCountry,
  locationLabel,
  resolveLocation,
  type Country,
  type SearchCriteria,
} from "@/lib/rental";
import { RentalLayout } from "./layout/rental-layout";
import { SearchForm } from "./search-form";
import { SearchResults } from "./search-results";
import { useRentalCountries, useRentalInventory } from "./use-rental-inventory";

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

function buildInventoryQuery({
  criteria,
  country,
  pickup,
  dropoff,
}: ReturnType<typeof readSearch>) {
  if (criteria.country && criteria.country !== "all" && !country) {
    throw new Error("ไม่พบประเทศที่เลือก กรุณาเลือกประเทศจากรายการค้นหา");
  }
  if (
    ((criteria.locationId || criteria.location) && !pickup) ||
    ((criteria.dropoffLocationId || criteria.return_location) && !dropoff)
  ) {
    throw new Error("กรุณาเลือกสาขารับและคืนรถจากรายการค้นหา");
  }

  const query = new URLSearchParams();
  if (country) query.set("country", country.code);
  if (pickup) query.set("locationId", pickup.id);
  if (dropoff) query.set("dropoffLocationId", dropoff.id);

  const { pickup_date, pickup_time, return_date, return_time } = criteria;
  const dateFields = [pickup_date, pickup_time, return_date, return_time];
  if (dateFields.some(Boolean)) {
    if (!dateFields.every(Boolean)) {
      throw new Error("กรุณาระบุวันและเวลารับรถและคืนรถให้ครบถ้วน");
    }
    if (!pickup) throw new Error("กรุณาเลือกสาขารับรถจากรายการค้นหา");
    const returnBranch = dropoff ?? pickup;
    const start = bookingInstant(pickup_date, pickup_time, pickup.timeZone);
    const end = bookingInstant(return_date, return_time, returnBranch.timeZone);
    if (end <= start) throw new Error("เวลาคืนรถต้องหลังเวลารับรถ");
    query.set("dropoffLocationId", returnBranch.id);
    query.set("startDateTime", start);
    query.set("endDateTime", end);
  }

  return query.toString();
}

export default function SearchRental() {
  const searchKey = useSearchParams().toString();
  const { countries, error: countryError } = useRentalCountries();
  const { criteria, query, validationError } = useMemo(() => {
    const search = readSearch(new URLSearchParams(searchKey), countries ?? []);
    try {
      return {
        criteria: search.criteria,
        query: countries === null ? null : buildInventoryQuery(search),
        validationError: "",
      };
    } catch (cause) {
      return {
        criteria: search.criteria,
        query: null,
        validationError: (cause as Error).message,
      };
    }
  }, [countries, searchKey]);
  const { cars, loading, error, refresh } = useRentalInventory(searchKey, query);
  const [editing, setEditing] = useState<SearchCriteria | null>(null);
  const countryList = countries ?? [];

  return (
    <>
      <RentalLayout
        page="search"
        countries={countryList}
        criteria={criteria}
        loading={loading}
        error={countryError || validationError || error}
        errorAction={
          countryList.length > 0 && (
            <button
              onClick={() => setEditing(criteria)}
              className="btn-primary mt-4 px-4 py-2"
            >
              แก้ไขการค้นหา
            </button>
          )
        }
        onBookingClose={refresh}
      >
        {({ onDetails, onBook }) => (
          <SearchResults
            key={searchKey}
            countries={countryList}
            cars={cars}
            criteria={criteria}
            onDetails={onDetails}
            onBook={onBook}
            onEdit={setEditing}
          />
        )}
      </RentalLayout>
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
