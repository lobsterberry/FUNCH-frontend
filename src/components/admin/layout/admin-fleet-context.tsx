"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { FleetSummary } from "@/lib/fleet";
type Network = { summary: FleetSummary; countries: { code: string; flag: string; name: string }[] };
const Context = createContext<{ network: Network | null; setNetwork: (network: Network) => void }>({ network: null, setNetwork: () => {} });
export function AdminFleetProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<Network | null>(null);
  return <Context.Provider value={{ network, setNetwork }}>{children}</Context.Provider>;
}
export function useAdminFleet() { return useContext(Context); }
