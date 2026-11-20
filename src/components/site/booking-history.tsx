"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/account";
import {
  bookingBranch,
  bookingCarName,
  bookingColors,
  bookingDate,
  bookingLabels,
  bookingMoney,
  type BookingSummary,
} from "@/lib/booking-display";
import { BookingDialog } from "./booking-dialog";
import { Header, Footer } from "./layout/site-header-footer";
import { useSiteAccount } from "./layout/site-account";

function BookingHistoryList({
  onSessionExpired,
}: {
  onSessionExpired: (member: null) => void;
}) {
  const [bookings, setBookings] = useState<BookingSummary[] | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api<{ success: true; data: BookingSummary[] }>("/api/bookings/mine")
      .then((result) => {
        if (!result?.success || !Array.isArray(result.data)) {
          throw new Error("Invalid booking history response");
        }
        if (active) setBookings(result.data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired(null);
        } else {
          setBookings("failed");
        }
      });
    return () => {
      active = false;
    };
  }, [attempt, onSessionExpired]);

  if (bookings === "failed") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <p role="alert" className="text-rose-800">โหลดประวัติการจองไม่สำเร็จ</p>
        <button
          type="button"
          className="btn-primary mt-4 px-4 py-2 text-sm"
          onClick={() => {
            setBookings(null);
            setAttempt((value) => value + 1);
          }}
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!bookings) {
    return <p role="status" className="text-slate-600">กำลังโหลดประวัติการจอง…</p>;
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium text-slate-700">คุณยังไม่มีรายการจอง</p>
        <Link href="/search" className="btn-primary mt-4 inline-block px-4 py-2 text-sm">
          ค้นหารถเช่า
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {bookings.map((booking) => (
        <li key={booking.id}>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-900">
                  {bookingCarName(booking)}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  เลขที่การจอง <span className="font-mono break-all">{booking.bookingNumber.toUpperCase()}</span>
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${bookingColors[booking.status]}`}>
                {bookingLabels[booking.status]}
              </span>
            </div>
            <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              {([
                ["pickup", "รับรถ", booking.startDateTime],
                ["dropoff", "คืนรถ", booking.endDateTime],
              ] as const).map(([kind, label, date]) => {
                const branch = bookingBranch(booking, kind);
                return (
                  <div key={kind}>
                    <dt className="text-sm text-slate-600">{label}</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      <time dateTime={date}>{bookingDate(date, branch.timeZone)}</time>
                    </dd>
                    <dd className="text-sm text-slate-600">{branch.name}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-slate-600">
                จองเมื่อ <time dateTime={booking.createdAt}>{bookingDate(booking.createdAt)}</time>
              </p>
              <p className="text-sm text-slate-600">
                ยอดรวม{" "}
                <strong className="text-lg font-semibold text-blue-700">
                  {bookingMoney(booking.totalPrice, booking.currencyCode)}
                </strong>
              </p>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function BookingHistory() {
  const [auth, setAuth] = useState<"login" | "register" | null>(null);
  const {
    member, updateMember, sessionLoading, accountError, refreshAccount,
    loggingOut, logout,
  } = useSiteAccount();

  return (
    <>
      <Header
        page="bookings"
        onAuth={setAuth}
        member={member}
        sessionLoading={sessionLoading}
        loggingOut={loggingOut}
        onLogout={logout}
      />
      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">
          ประวัติการจอง
        </h1>
        {accountError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p role="alert" className="text-rose-800">{accountError}</p>
            {!member && (
              <button type="button" onClick={refreshAccount} className="mt-2 text-sm font-medium text-blue-700 hover:underline">
                ลองอีกครั้ง
              </button>
            )}
          </div>
        )}
        {sessionLoading ? (
          <p role="status" className="text-slate-600">กำลังตรวจสอบบัญชี…</p>
        ) : member ? (
          <BookingHistoryList key={member.id} onSessionExpired={updateMember} />
        ) : !accountError && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-medium text-slate-700">กรุณาเข้าสู่ระบบเพื่อดูประวัติการจอง</p>
            <button type="button" onClick={() => setAuth("login")} className="btn-primary mt-4 px-4 py-2 text-sm">
              เข้าสู่ระบบ
            </button>
          </div>
        )}
      </main>
      <Footer />
      {auth && (
        <BookingDialog
          authOnly
          initialTab={auth}
          member={member}
          sessionLoading={sessionLoading}
          onMemberChange={updateMember}
          onClose={() => setAuth(null)}
        />
      )}
    </>
  );
}
