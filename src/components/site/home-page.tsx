"use client";

import { useEffect } from "react";
import { emptySearchCriteria } from "@/lib/rental";
import { HomeContent } from "./home-content";
import { RentalLayout } from "./layout/rental-layout";
import { useRentalCountries, useRentalInventory } from "./use-rental-inventory";

export default function HomeRental() {
  const { countries, error: countryError } = useRentalCountries();
  const { cars, loading, error, refresh } = useRentalInventory(
    "",
    countries === null ? null : "",
  );
  const countryList = countries ?? [];

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  return (
    <RentalLayout
      page="home"
      countries={countryList}
      criteria={emptySearchCriteria}
      loading={loading}
      error={countryError || error}
      onBookingClose={refresh}
    >
      {({ onDetails, onBook }) => (
        <HomeContent
          countries={countryList}
          cars={cars}
          criteria={emptySearchCriteria}
          onDetails={onDetails}
          onBook={onBook}
        />
      )}
    </RentalLayout>
  );
}
