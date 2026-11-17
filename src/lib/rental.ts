export type LocationItem = {
  id: string;
  name: string;
  nameTh: string;
  city: string;
  cityTh: string;
  airportCode: string | null;
  timeZone: string;
};

export type Country = {
  code: string;
  name: string;
  english: string;
  flag: string;
  currencyCode?: string;
  drivingSide?: "LEFT" | "RIGHT";
  steering: "right" | "left";
  city: string;
  location: string;
  cities: string[];
  locations?: LocationItem[];
};

export type Car = {
  id: string;
  carModelId?: string;
  carModelLocationId?: string | null;
  availableCount?: number;
  availabilityChecked?: boolean;
  quotedTotal?: number;
  quotedDays?: number;
  quotedHours?: number;
  transmissionType?: "AUTOMATIC" | "MANUAL";
  categories?: string[];
  name: string;
  model: string;
  brand?: string;
  country: string;
  city: string;
  category: string;
  badge: string;
  description: string;
  seats: number;
  bags: number;
  gear: string;
  fuel: string;
  steering: "right" | "left";
  day: number;
  hour: number;
  hourlyRate?: string | number;
  dailyRate?: string | number;
  currencyCode?: string;
  rating: number;
  reviews: number;
  features: string[];
  provider: string;
  color: string;
  featured?: boolean;
  isAvailable?: boolean;
  licensePlate?: string;
  locationId?: string | null;
  location?: LocationItem | null;
};

export type SearchCriteria = {
  country: string;
  locationId?: string;
  dropoffLocationId?: string;
  location: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  return_location?: string;
  service?: string;
};

export function locationLabel(location: LocationItem): string {
  return `${location.cityTh || location.city} - ${location.nameTh || location.name}${location.airportCode ? ` (${location.airportCode} Airport)` : ''}`;
}

// Resolve old bookmarked URLs once; new searches always send a branch ID.
export function resolveLocation(locations: LocationItem[], id?: string, label?: string) {
  if (id) return locations.find((location) => location.id === id);
  return locations.find((location) => locationLabel(location) === label || location.name === label || location.nameTh === label)
    ?? locations.find((location) => label?.includes(location.nameTh) || label?.includes(location.name));
}
const fallbackCountry: Country = {
  code: "JP",
  name: "ญี่ปุ่น",
  english: "Japan",
  flag: "🇯🇵",
  city: "โตเกียว",
  location: "โตเกียว - สนามบินฮาเนดะ (HND Airport)",
  steering: "right",
  cities: ["โตเกียว", "โอซาก้า", "ฟุกุโอกะ", "ฮอกไกโด"],
};

export const defaultCriteria: SearchCriteria = {
  country: "JP",
  location: "โตเกียว - สนามบินฮาเนดะ (HND Airport)",
  pickup_date: "2026-11-20",
  pickup_time: "10:00",
  return_date: "2026-11-22",
  return_time: "15:00",
  service: "self-drive",
};

export const getCountry = (
  code: string,
  countryList: Country[] = [],
): Country =>
  countryList.find((country) => country.code === code) ??
  countryList[0] ??
  fallbackCountry;

export function getSearchCities(
  criteria: Pick<SearchCriteria, "country" | "location">,
  countryList: Country[] = [],
): string[] {
  const country = countryList.find((item) => item.code === criteria.country);
  if (!country) return [];
  const location = criteria.location.trim().normalize("NFC");
  return country.cities.filter((city) => location.includes(city));
}

export const money = (amount: number) => `฿${amount.toLocaleString("th-TH")}`;

function wallTime(date: string, time: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  )
    return NaN;
  const parsed = Date.parse(`${date}T${time}:00Z`);
  return Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === date
    ? parsed
    : NaN;
}

// Treat inputs as wall-clock time at the destination, independent of the viewer's timezone.
export function rentalDuration(criteria: SearchCriteria) {
  const start = wallTime(criteria.pickup_date, criteria.pickup_time);
  const end = wallTime(criteria.return_date, criteria.return_time);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return null;
  const elapsedHours = Math.ceil((end - start) / 3_600_000);
  let days = Math.floor(elapsedHours / 24);
  let hours = elapsedHours % 24;
  const lateReturn = criteria.return_time > "14:00";
  if (hours > 8 || (lateReturn && hours > 0)) {
    days += 1;
    hours = 0;
  }
  return {
    days,
    hours,
    elapsedDays: Math.floor(elapsedHours / 24),
    elapsedHours: elapsedHours % 24,
    lateReturn,
    label: [days > 0 ? `${days} วัน` : "", hours > 0 ? `${hours} ชั่วโมง` : ""]
      .filter(Boolean)
      .join(" "),
  };
}

export function rentalTotal(
  car: Pick<Car, "day" | "hour">,
  criteria: SearchCriteria,
) {
  const duration = rentalDuration(criteria);
  return duration
    ? duration.days * car.day + Math.min(duration.hours * car.hour, car.day)
    : null;
}
