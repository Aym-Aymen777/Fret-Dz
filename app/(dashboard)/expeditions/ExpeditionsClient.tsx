"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  ExpeditionsClient Component
//  Handles status filter state + renders grid
// ─────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import ShipmentCard from "@/components/ShipmentCard";

interface ExpeditionsClientProps {
  initialShipments: Shipment[];
}

type StatusFilter = ShipmentStatus | "all";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Toutes",      value: "all"        },
  { label: "En attente",  value: "pending"    },
  { label: "Acceptées",   value: "accepted"   },
  { label: "En transit",  value: "in_transit" },
  { label: "Livrées",     value: "delivered"  },
  { label: "Refusées",    value: "rejected"   },
];

export default function ExpeditionsClient({ initialShipments }: ExpeditionsClientProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);

  const displayed = filter === "all"
    ? shipments
    : shipments.filter((s) => s.status === filter);

  function countFor(value: StatusFilter) {
    if (value === "all") return shipments.length;
    return shipments.filter((s) => s.status === value).length;
  }

  function handleDeleted(id: string) {
    setShipments((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ label, value }) => {
          const count = countFor(value);
          const isActive = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
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

      {/* ── Grid ── */}
      {displayed.length === 0 ? (
        <div className="card card-body flex flex-col items-center gap-4 py-20 text-center">
          <span className="text-5xl">📦</span>
          <div>
            <p className="text-base font-semibold text-[var(--fg)]">
              {filter === "all" ? "Aucune expédition encore" : "Aucune expédition dans cette catégorie"}
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              {filter === "all"
                ? "Créez votre première expédition pour commencer."
                : `Vous n'avez pas d'expéditions avec le statut « ${STATUS_FILTERS.find((f) => f.value === filter)?.label} ».`}
            </p>
          </div>
          {filter === "all" && (
            <Link href="/create-shipment" className="btn-primary">
              Créer une expédition
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {displayed.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
