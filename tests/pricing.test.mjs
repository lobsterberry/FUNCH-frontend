import test from "node:test";
import assert from "node:assert/strict";
import { rentalDuration, rentalTotal } from "../src/lib/rental.ts";

const criteria = (pickupDate, pickupTime, returnDate, returnTime) => ({
  country: "",
  location: "",
  pickup_date: pickupDate,
  pickup_time: pickupTime,
  return_date: returnDate,
  return_time: returnTime,
});
const rate = { day: 2200, hour: 280 };

test("same-day two-hour rental charges hourly", () => {
  const trip = criteria("2026-11-20", "10:00", "2026-11-20", "12:00");
  assert.equal(rentalTotal(rate, trip), 560);
  assert.equal(rentalDuration(trip).label, "2 ชั่วโมง");
});
test("return at 14:00 remains hourly; after 14:00 charges a day", () => {
  assert.equal(
    rentalTotal(rate, criteria("2026-11-20", "10:00", "2026-11-20", "14:00")),
    1120,
  );
  assert.equal(
    rentalTotal(rate, criteria("2026-11-20", "10:00", "2026-11-20", "14:01")),
    2200,
  );
});
test("eight hours is the hourly threshold; over eight becomes one day", () => {
  const rateWithDistinctTotals = { day: 2500, hour: 200 };
  assert.equal(
    rentalTotal(
      rateWithDistinctTotals,
      criteria("2026-11-20", "02:00", "2026-11-20", "10:00"),
    ),
    1600,
  );
  assert.equal(
    rentalTotal(
      rateWithDistinctTotals,
      criteria("2026-11-20", "02:00", "2026-11-20", "11:00"),
    ),
    2500,
  );
});
test("hourly charging resumes after a full 24-hour period", () => {
  const trip = criteria("2026-11-20", "10:00", "2026-11-21", "11:00");
  assert.equal(rentalDuration(trip).label, "1 วัน 1 ชั่วโมง");
  assert.equal(rentalTotal(rate, trip), 2480);
});
test("wireframe's 2 days 5 hours with a 15:00 return charges 3 days", () => {
  const trip = criteria("2026-11-20", "10:00", "2026-11-22", "15:00");
  assert.equal(rentalDuration(trip).label, "3 วัน");
  assert.equal(rentalTotal(rate, trip), 6600);
});
test("an exact full-day period does not add another late-return day", () => {
  assert.equal(
    rentalTotal(rate, criteria("2026-11-20", "15:00", "2026-11-21", "15:00")),
    2200,
  );
});
test("rejects invalid dates, times and non-positive rental periods", () => {
  for (const trip of [
    criteria("2026-11-20", "10:00", "2026-11-20", "10:00"),
    criteria("2026-11-20", "10:00", "2026-11-19", "12:00"),
    criteria("2026-02-30", "10:00", "2026-03-02", "12:00"),
    criteria("2026-11-20", "25:00", "2026-11-21", "12:00"),
    criteria("invalid", "10:00", "2026-11-21", "12:00"),
  ])
    assert.equal(rentalTotal(rate, trip), null);
});
test("hourly subtotal is capped at the daily rate", () => {
  assert.equal(
    rentalTotal(
      { day: 1000, hour: 300 },
      criteria("2026-11-20", "08:00", "2026-11-20", "13:00"),
    ),
    1000,
  );
});
