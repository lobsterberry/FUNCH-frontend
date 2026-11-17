import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyFleetFilters, fleetResults, modelBranches, transferOffers, fleetCsv } from '../src/lib/fleet-view.ts';

const model = { id: 'model', brand: 'Toyota', model: 'Harrier', categories: ['SUV'] };
const emptyModel = { ...model, id: 'empty', model: 'Empty' };
const location = (id) => ({ id, name: id, nameTh: id, cityTh: 'Tokyo', countryCode: 'JP' });
const offer = (id, branch, provider = 'Provider', active = true) => ({ id, carModelId: 'model', carModel: model,
  locationId: branch, location: location(branch), providerName: provider, isActive: active });
const unit = { id: 'unit', carModelId: 'model', carModelLocationId: 'offer-a', homeLocationId: 'A', locationId: 'B', location: location('B'),
  country: 'JP', provider: 'Provider', name: 'Toyota Harrier', licensePlate: 'PLATE-123', categories: ['SUV'], fleetStatus: 'AVAILABLE', year: 2026 };
const data = { models: [model, emptyModel], offers: [offer('offer-a', 'A'), offer('offer-b', 'B'), offer('offer-b2', 'B')], units: [unit] };
test('all views filter the same physical units and retain empty models/offers for administration', () => {
  assert.equal(fleetResults(data, emptyFleetFilters).models.length, 2);
  const result = fleetResults(data, { ...emptyFleetFilters, location: 'B', search: 'plate-123' });
  assert.deepEqual(result.units.map((unit) => unit.id), ['unit']);
  assert.deepEqual(result.models.map((model) => model.id), ['model']);
  assert.equal(result.offers.length, 2);
  assert.equal(fleetResults(data, { ...emptyFleetFilters, location: 'A', search: 'plate-123' }).units.length, 0);
  assert.equal(fleetResults(data, { ...emptyFleetFilters, status: 'MAINTENANCE' }).offers.length, 0);
  assert.equal(fleetResults(data, { ...emptyFleetFilters, category: 'MPV' }).models.length, 0);
});
test('returned cars appear once at their current location even with duplicate offers', () => {
  const branches = modelBranches('model', data.offers, data.units);
  assert.equal(branches.length, 2);
  assert.equal(branches.find((branch) => branch.locationId === 'A').units.length, 0);
  assert.equal(branches.find((branch) => branch.locationId === 'B').offers.length, 2);
  assert.equal(branches.flatMap((branch) => branch.units).length, 1);
});
test('unassigned cars remain discoverable and zero-stock offers do not match a vehicle status', () => {
  const unassigned = { ...unit, id: 'unassigned', carModelId: undefined, carModelLocationId: null, locationId: null, location: null, fleetStatus: 'UNASSIGNED' };
  assert.equal(fleetResults({ ...data, units: [unassigned] }, { ...emptyFleetFilters, status: 'UNASSIGNED' }).units.length, 1);
  assert.equal(fleetResults({ ...data, units: [] }, { ...emptyFleetFilters, status: 'AVAILABLE' }).offers.length, 0);
});
test('transfer choices require matching model, provider, country and active destination', () => {
  const choices = [...data.offers, offer('other-provider', 'C', 'Other'), offer('closed', 'D', 'Provider', false),
    { ...offer('foreign', 'US'), location: { ...location('US'), countryCode: 'US' } }, { ...offer('other-model', 'E'), carModelId: 'other' }];
  assert.deepEqual(transferOffers(unit, choices).map((offer) => offer.id), ['offer-a']);
});
test('CSV exports real metadata, neutralizes formulas and escapes quotes', () => {
  const csv = fleetCsv([{ ...unit, licensePlate: '=SUM(A1)', exteriorColor: 'White "Pearl"', odometerKm: 12500, vin: 'CHASSIS', hour: 100, day: 1000 }]);
  assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('"\'=SUM(A1)"'));
  assert.ok(csv.includes('White ""Pearl""')); assert.ok(csv.includes('CHASSIS')); assert.ok(csv.includes('พร้อมบริการ'));
});
