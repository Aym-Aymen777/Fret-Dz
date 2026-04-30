"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  useTransporters hook
//  Fetches available transporters and manages
//  vehicle-type filter state client-side.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transporter, VehicleType } from "@/lib/types";

export type VehicleFilter = VehicleType | "all";

interface UseTransportersReturn {
  transporters: Transporter[];        // filtered list shown in UI
  allTransporters: Transporter[];     // full unfiltered list
  loading: boolean;
  error: string | null;
  selectedVehicle: VehicleFilter;
  setSelectedVehicle: (v: VehicleFilter) => void;
  refresh: () => Promise<void>;
}

export function useTransporters(): UseTransportersReturn {
  const [supabase] = useState(() => createClient());
  const [allTransporters, setAllTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleFilter>("all");

  const fetchTransporters = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("transporters")
      .select("*")
      .eq("is_available", true)
      .order("rating", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAllTransporters((data as Transporter[]) ?? []);
    }

    setLoading(false);
  }, [supabase]);

  // Derive filtered list — no extra fetch needed
  const transporters = useMemo(() => {
    if (selectedVehicle === "all") return allTransporters;
    return allTransporters.filter((t) => t.vehicle_type === selectedVehicle);
  }, [allTransporters, selectedVehicle]);

  useEffect(() => {
    fetchTransporters();
  }, [fetchTransporters]);

  return {
    transporters,
    allTransporters,
    loading,
    error,
    selectedVehicle,
    setSelectedVehicle,
    refresh: fetchTransporters,
  };
}