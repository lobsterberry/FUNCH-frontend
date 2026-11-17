import test from "node:test";
import assert from "node:assert/strict";
import { bookingInstant } from "../src/lib/booking-time.ts";

test("booking times use the pickup timezone regardless of the visitor timezone", () => {
  assert.equal(bookingInstant("2026-12-01", "10:00", "Asia/Tokyo"), "2026-12-01T01:00:00.000Z");
  assert.equal(bookingInstant("2026-12-01", "10:00", "Asia/Bangkok"), "2026-12-01T03:00:00.000Z");
  assert.equal(bookingInstant("2026-12-01", "10:00", "America/Los_Angeles"), "2026-12-01T18:00:00.000Z");
  assert.equal(bookingInstant("2026-07-01", "10:00", "America/Los_Angeles"), "2026-07-01T17:00:00.000Z");
});

test("invalid calendar dates and ambiguous or missing DST times are rejected", () => {
  assert.throws(() => bookingInstant("2026-02-30", "10:00", "Asia/Tokyo"));
  assert.throws(() => bookingInstant("2026-12-01", "25:00", "Asia/Tokyo"));
  assert.throws(() => bookingInstant("2027-03-14", "02:30", "America/New_York"));
  assert.throws(() => bookingInstant("2027-11-07", "01:30", "America/New_York"));
});
