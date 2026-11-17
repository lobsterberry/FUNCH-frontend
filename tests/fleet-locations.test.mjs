import test from 'node:test';
import assert from 'node:assert/strict';
import { locationLabel, resolveLocation } from '../src/lib/rental.ts';
import { bookingInstant } from '../src/lib/booking-time.ts';

const locations = [
  { id: 'airport-a', name: 'Airport A', nameTh: 'Airport A', city: 'Same City', cityTh: 'Same City', airportCode: 'AAA', timeZone: 'America/Los_Angeles' },
  { id: 'airport-b', name: 'Airport B', nameTh: 'Airport B', city: 'Same City', cityTh: 'Same City', airportCode: 'BBB', timeZone: 'America/New_York' },
];
test('branch IDs distinguish locations in the same city and invalid IDs never fall back', () => {
  assert.equal(resolveLocation(locations, 'airport-b', locationLabel(locations[0])).id, 'airport-b');
  assert.equal(resolveLocation(locations, 'missing', locationLabel(locations[0])), undefined);
  assert.equal(resolveLocation(locations, undefined, 'Same City'), undefined);
  assert.equal(resolveLocation(locations, undefined, locationLabel(locations[1])).id, 'airport-b');
});
test('one-way pickup and return use their own branch timezones', () => {
  const pickup = bookingInstant('2030-01-01', '10:00', locations[0].timeZone);
  const dropoff = bookingInstant('2030-01-01', '18:00', locations[1].timeZone);
  assert.equal((Date.parse(dropoff) - Date.parse(pickup)) / 3_600_000, 5);
});
