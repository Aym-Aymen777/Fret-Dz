"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  TransportersClient Component
//  Handles vehicle filter state + renders grid
// ─────────────────────────────────────────────
import { useEffect } from "react";
import TransporterCard from "@/components/TransporterCard";
import { useTransporters, type VehicleFilter } from "@/hooks/useTransporters";
import type { Transporter, VehicleType } from "@/lib/types";

interface TransportersClientProps {
  initialTransporters: Transporter[];
}

const VEHICLE_LABELS: Record<VehicleType, string> = {
  van:        "Fourgon",
  truck:      "Camion",
  semi:       "Semi-remorque",
  pickup:     "Pickup",
  motorcycle: "Moto",
};

const VEHICLE_FILTERS: { label: string; value: VehicleFilter }[] = [
  { label: "Tous",          value: "all"        },
  { label: "Fourgon",       value: "van"        },
  { label: "Camion",        value: "truck"      },
  { label: "Semi-remorque", value: "semi"       },
  { label: "Pickup",        value: "pickup"     },
  { label: "Moto",          value: "motorcycle" },
];

export default function TransportersClient({ initialTransporters }: TransportersClientProps) {
  const {
    transporters,
    allTransporters,
    loading,
    error,
    selectedVehicle,
    setSelectedVehicle,
  } = useTransporters();

  // Count per vehicle type from the full unfiltered list
  function countFor(value: VehicleFilter): number {
    if (value === "all") return allTransporters.length;
    return allTransporters.filter((t) => t.vehicle_type === value).length;
  }

  // Use initialTransporters on first render before hook fetches
  const displayed = loading ? initialTransporters : transporters;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {VEHICLE_FILTERS.map(({ label, value }) => {
          const count = loading
            ? value === "all"
              ? initialTransporters.length
              : initialTransporters.filter((t) => t.vehicle_type === value).length
            : countFor(value);

          const isActive = selectedVehicle === value;

          return (
            <button
              key={value}
              onClick={() => setSelectedVehicle(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 border
                ${isActive
                  ? "bg-primary-500 text-white border-primary-500"
                  : "border-[var(--border)] text-[var(--fg-muted)] hover:border-primary-500/50 hover:text-primary-500"
                }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="text-lg">⚠️</span>
          <span>Erreur lors du chargement des transporteurs : {error}</span>
        </div>
      )}

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="card card-body flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🚛</span>
          <p className="text-base font-semibold text-[var(--fg)]">
            Aucun transporteur trouvé
          </p>
          <p className="text-sm text-[var(--fg-muted)]">
            {selectedVehicle !== "all"
              ? `Aucun transporteur disponible avec un véhicule de type « ${VEHICLE_LABELS[selectedVehicle as VehicleType]} ».`
              : "Revenez bientôt — notre réseau grandit chaque jour."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {displayed.map((t) => (
            <TransporterCard key={t.id} transporter={t} />
          ))}
        </div>
      )}
    </div>
  );
}