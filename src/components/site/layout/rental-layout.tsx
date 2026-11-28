import { useState, type ReactNode } from "react";
import { getCountry, type Car, type Country, type SearchCriteria } from "@/lib/rental";
import { BookingDialog } from "../booking-dialog";
import { CarDetails } from "../car-detail-dialog";
import { useSiteAccount } from "./site-account";
import { Footer, Header } from "./site-header-footer";

export function RentalLayout({
  page,
  countries,
  criteria,
  loading,
  error,
  errorAction,
  onBookingClose,
  children,
}: {
  page: "home" | "search";
  countries: Country[];
  criteria: SearchCriteria;
  loading: boolean;
  error: string;
  errorAction?: ReactNode;
  onBookingClose: () => void;
  children: (actions: {
    onDetails: (car: Car) => void;
    onBook: (car: Car) => void;
  }) => ReactNode;
}) {
  const { member, updateMember, sessionLoading, accountError, loggingOut, logout } =
    useSiteAccount();
  const [details, setDetails] = useState<Car | null>(null);
  const [booking, setBooking] = useState<Car | null>(null);
  const [auth, setAuth] = useState<"login" | "register" | null>(null);

  return (
    <>
      <Header
        page={page}
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
      {error ? (
        <main className="p-8 text-center">
          <p role="alert" className="text-rose-700">
            {error}
          </p>
          {errorAction}
        </main>
      ) : loading ? (
        <main className="p-12 text-center" role="status">
          กำลังโหลดข้อมูลรถ…
        </main>
      ) : (
        children({ onDetails: setDetails, onBook: setBooking })
      )}
      <Footer />
      {details && (
        <CarDetails
          car={details}
          country={getCountry(details.country, countries)}
          onClose={() => setDetails(null)}
          onBook={(car) => {
            setDetails(null);
            setBooking(car);
          }}
        />
      )}
      {booking && (
        <BookingDialog
          car={booking}
          criteria={criteria}
          countries={countries}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={updateMember}
          onClose={() => {
            setBooking(null);
            onBookingClose();
          }}
        />
      )}
      {auth && (
        <BookingDialog
          authOnly
          initialTab={auth}
          criteria={criteria}
          countries={countries}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={updateMember}
          onClose={() => setAuth(null)}
        />
      )}
    </>
  );
}
