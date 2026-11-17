import type { FleetCatalogData, FleetModel, FleetOffer, FleetStatus, FleetUnit } from './fleet.ts';

export type FleetFilters = { search: string; country: string; location: string; category: string; status: string; model: string };
export const emptyFleetFilters: FleetFilters = { search: '', country: 'all', location: 'all', category: 'all', status: 'all', model: 'all' };
export const fleetStatusLabels: Record<FleetStatus, string> = {
  AVAILABLE: 'พร้อมบริการ', IN_USE: 'กำลังเช่า', RESERVED: 'จองแล้ว', OVERDUE: 'เกินกำหนดคืน',
  CLEANING: 'เตรียมรถ / ทำความสะอาด', MAINTENANCE: 'ซ่อมบำรุง', INACTIVE: 'ปิดบริการ', UNASSIGNED: 'ยังไม่จัดสาขา',
};
const matches = (term: string, values: unknown[]) => !term || values.join(' ').toLocaleLowerCase().includes(term);

// Filter the common data once so every view and export sees the same physical units.
export function fleetResults(data: FleetCatalogData, filters: FleetFilters) {
  const term = filters.search.trim().toLocaleLowerCase();
  const offersById = new Map(data.offers.map((offer) => [offer.id, offer]));
  const modelMatches = (model: FleetModel) => (filters.category === 'all' || model.categories.includes(filters.category as FleetModel['categories'][number])) &&
    (filters.model === 'all' || model.id === filters.model);
  const units = data.units.filter((unit) => {
    const home = offersById.get(unit.carModelLocationId || '');
    return (filters.country === 'all' || unit.country === filters.country) &&
      (filters.location === 'all' || unit.locationId === filters.location) &&
      (filters.category === 'all' || unit.categories.includes(filters.category as FleetModel['categories'][number])) &&
      (filters.model === 'all' || unit.carModelId === filters.model) &&
      (filters.status === 'all' || unit.fleetStatus === filters.status) &&
      matches(term, [unit.name, unit.licensePlate, unit.provider, unit.location?.nameTh, unit.location?.name, unit.city, home?.carModel.brand]);
  });
  const unitIds = new Set(units.map((unit) => unit.carModelId));
  const offers = data.offers.filter((offer) => modelMatches(offer.carModel) &&
    (filters.country === 'all' || offer.location.countryCode === filters.country) &&
    (filters.location === 'all' || offer.locationId === filters.location) &&
    // Empty offers are useful for administration, except when filtering vehicle status.
    (units.some((unit) => unit.carModelId === offer.carModelId && unit.locationId === offer.locationId && unit.provider === offer.providerName) ||
      filters.status === 'all' && matches(term, [offer.carModel.brand, offer.carModel.model, offer.location.nameTh, offer.location.name, offer.location.cityTh, offer.providerName])));
  const modelIds = new Set(offers.map((offer) => offer.carModelId));
  const models = data.models.filter((model) => modelMatches(model) && (unitIds.has(model.id) || modelIds.has(model.id) ||
    filters.country === 'all' && filters.location === 'all' && filters.status === 'all' && matches(term, [model.brand, model.model])));
  return { units, offers, models };
}

export function modelBranches(modelId: string, offers: FleetOffer[], units: FleetUnit[]) {
  type Branch = { key: string; locationId: string | null; name: string; country: string; provider: string;
    offers: FleetOffer[]; units: FleetUnit[] };
  const branches = new Map<string, Branch>();
  const key = (location: string | null | undefined, provider: string) => JSON.stringify([location || null, provider]);
  for (const offer of offers.filter((item) => item.carModelId === modelId)) {
    const id = key(offer.locationId, offer.providerName);
    const branch = branches.get(id) || { key: id, locationId: offer.locationId, name: offer.location.nameTh || offer.location.name,
      country: offer.location.countryCode, provider: offer.providerName, offers: [], units: [] };
    branch.offers.push(offer); branches.set(id, branch);
  }
  for (const unit of units.filter((item) => item.carModelId === modelId)) {
    const id = key(unit.locationId, unit.provider);
    const branch = branches.get(id) || { key: id, locationId: unit.locationId || null, name: unit.location?.nameTh || 'ยังไม่จัดสาขา',
      country: unit.country, provider: unit.provider, offers: [], units: [] };
    branch.units.push(unit); branches.set(id, branch);
  }
  return [...branches.values()];
}

export function transferOffers(unit: FleetUnit, offers: FleetOffer[]) {
  return offers.filter((offer) => offer.isActive && offer.carModelId === unit.carModelId && offer.providerName === unit.provider &&
    offer.location.countryCode === unit.country && offer.locationId !== unit.locationId);
}

export function fleetCsv(units: FleetUnit[]) {
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [
    ['ทะเบียน', 'รุ่น', 'ปี', 'ประเทศ', 'สาขาปัจจุบัน', 'ผู้ให้บริการ', 'สี', 'เลขไมล์ (km)', 'VIN', 'รายชั่วโมง (THB)', 'รายวัน (THB)', 'สถานะ'],
    ...units.map((unit) => [unit.licensePlate, unit.name, unit.year, unit.country, unit.location?.nameTh, unit.provider,
      unit.exteriorColor, unit.odometerKm, unit.vin, unit.hour, unit.day, fleetStatusLabels[unit.fleetStatus]]),
  ].map((row) => row.map(cell).join(',')).join('\r\n');
}
