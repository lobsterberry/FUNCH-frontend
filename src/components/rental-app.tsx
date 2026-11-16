"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  countries,
  defaultCriteria,
  getCountry,
  type Car,
  type SearchCriteria,
} from "@/lib/rental";
import { HomeContent } from "./home-content";
import { Header, Footer } from "./site-chrome";
import { SearchResults } from "./search-results";
import { BookingDialog, CarDetails, Dialog } from "./rental-dialog";
import { SearchForm } from "./search-form";

export default function RentalApp({ mode }: { mode: "home" | "search" }) {
  const params = useSearchParams();
  const [details, setDetails] = useState<Car | null>(null);
  const [booking, setBooking] = useState<Car | null>(null);
  const [auth, setAuth] = useState<"login" | "register" | null>(null);
  const [editing, setEditing] = useState<SearchCriteria | null>(null);
  const rawCountry = params.get("country");
  const country =
    rawCountry === "all" || countries.some((item) => item.code === rawCountry)
      ? rawCountry!
      : "JP";
  const criteria: SearchCriteria =
    mode === "home"
      ? defaultCriteria
      : {
          country,
          location: params.get("location") || getCountry(country).location,
          pickup_date: params.get("pickup_date") ?? defaultCriteria.pickup_date,
          pickup_time: params.get("pickup_time") ?? defaultCriteria.pickup_time,
          return_date: params.get("return_date") ?? defaultCriteria.return_date,
          return_time: params.get("return_time") ?? defaultCriteria.return_time,
          return_location: params.get("return_location") ?? undefined,
          service: "self-drive",
        };
  return (
    <>
      <Header search={mode === "search"} onAuth={setAuth} />
      {mode === "home" ? (
        <HomeContent onDetails={setDetails} onBook={setBooking} />
      ) : (
        <SearchResults
          key={params.toString()}
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
          onClose={() => setBooking(null)}
        />
      )}{" "}
      {auth && (
        <BookingDialog
          authOnly
          initialTab={auth}
          criteria={criteria}
          onClose={() => setAuth(null)}
        />
      )}{" "}
      {editing && (
        <Dialog wide title="แก้ไขการค้นหา" onClose={() => setEditing(null)}>
          <SearchForm initial={editing} onComplete={() => setEditing(null)} />
        </Dialog>
      )}
    </>
  );
}
