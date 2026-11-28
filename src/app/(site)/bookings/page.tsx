import type { Metadata } from "next";
import { BookingHistory } from "@/components/site/booking-history-page";

export const metadata: Metadata = {
  title: "ประวัติการจอง | FUNCH Drive",
};

export default function BookingsPage() {
  return <BookingHistory />;
}
