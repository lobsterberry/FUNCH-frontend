import type { AdminCar, CarCategory } from "./cars-management";
import type { LocationItem } from "./rental";

export type CarModel = {
  id: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  luggageCapacity: number;
  transmission: string;
  transmissionType: "AUTOMATIC" | "MANUAL";
  fuelType: string;
  steeringSide: "RHD" | "LHD";
  categories: CarCategory[];
  categoryLabel: string;
  featureCodes: string[];
  options: { code: string; label: string; included: boolean }[] | null;
  description?: string;
  imageUrl?: string | null;
  rating?: number | string;
  reviewCount?: number;
  isFeatured?: boolean;
  totalCars?: number;
  locationCount?: number;
};
export type CarOffer = {
  id: string;
  carModelId: string;
  locationId: string;
  providerName: string;
  hourlyRate: string | number;
  dailyRate: string | number;
  isActive: boolean;
  turnaroundMinutes: number;
  carModel: CarModel;
  location: LocationItem & { countryCode: string };
  _count: { cars: number };
  inventoryCount?: number;
};
export type VehicleStatus =
  | "AVAILABLE"
  | "CLEANING"
  | "MAINTENANCE"
  | "INACTIVE";
export type InventoryStatus =
  | VehicleStatus
  | "IN_USE"
  | "RESERVED"
  | "OVERDUE"
  | "UNASSIGNED";
export type CarUnit = AdminCar & {
  operationalStatus: VehicleStatus;
  inventoryStatus: InventoryStatus;
  hasBookings: boolean;
  overdue: boolean;
  homeLocationId: string | null;
  exteriorColor: string | null;
  odometerKm: number | null;
  vin: string | null;
  availableFrom: string | null;
};
export type CarsSummary = {
  models: number;
  locations: number;
  countries: number;
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
};
export type CarsCatalogData = {
  models: CarModel[];
  offers: CarOffer[];
  units: CarUnit[];
  summary: CarsSummary;
  generatedAt: string;
  locationInventory: {
    locationId: string;
    totalCars: number;
    activeCars: number;
  }[];
};
type InventoryDetails = {
  carModelLocationId: string;
  year: number;
  isAvailable: boolean;
  operationalStatus?: VehicleStatus;
  exteriorColor?: string | null;
  odometerKm?: number | null;
};
export type InventoryInput = InventoryDetails & {
  licensePlate: string;
  vin?: string | null;
  transfer?: boolean;
  transferNote?: string;
};
export type BulkInventoryInput = InventoryDetails & { licensePlates: string[] };
export type InventoryMutation = InventoryInput | BulkInventoryInput;
export const offerLabel = (offer: CarOffer) =>
  `${offer.carModel.brand} ${offer.carModel.model} ${offer.carModel.year} · ${offer.location.nameTh || offer.location.name} · ${offer.providerName}`;
