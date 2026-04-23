// ─────────────────────────────────────────────
//  Fret-DZ  |  TransporterCard Component
//  Server-safe (no hooks / events)
// ─────────────────────────────────────────────
import Link from "next/link";
import type { Transporter, VehicleType } from "@/lib/types";

interface TransporterCardProps {
  transporter: Transporter;
}

const VEHICLE_ICONS: Record<VehicleType, string> = {
  van:        "🚐",
  truck:      "🚛",
  semi:       "🚚",
  pickup:     "🛻",
  motorcycle: "🏍️",
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  van:        "Fourgon",
  truck:      "Camion",
  semi:       "Semi-remorque",
  pickup:     "Pickup",
  motorcycle: "Moto",
};

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? "text-secondary fill-current"
              : "text-muted-300 dark:text-muted-600 fill-current"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-[var(--fg-muted)] ml-0.5">({count})</span>
    </div>
  );
}

export default function TransporterCard({ transporter }: TransporterCardProps) {
  return (
    <article className="card-hover group relative flex flex-col overflow-hidden">
      {/* ── Availability indicator ── */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold
          ${transporter.is_available
            ? "bg-success/10 text-emerald-700 dark:text-emerald-300 border border-success/20"
            : "bg-muted-100 dark:bg-muted-800 text-[var(--fg-muted)] border border-[var(--border)]"
          }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            transporter.is_available ? "bg-success animate-pulse-slow" : "bg-muted-400"
          }`}
        />
        {transporter.is_available ? "Disponible" : "Indisponible"}
      </div>

      <div className="card-body flex flex-col gap-4">
        {/* ── Header: logo + name ── */}
        <div className="flex items-start gap-3 pr-24">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent/20 text-2xl">
            {transporter.logo_url ? (
              <img
                src={transporter.logo_url}
                alt={transporter.company_name}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              VEHICLE_ICONS[transporter.vehicle_type]
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--fg)] group-hover:text-primary-500 transition-colors">
              {transporter.company_name}
            </h3>
            <p className="text-sm text-[var(--fg-muted)]">{transporter.wilaya}</p>
            <StarRating rating={transporter.rating} count={transporter.rating_count} />
          </div>
        </div>

        {/* ── Info grid ── */}
        <dl className="grid grid-cols-2 gap-2.5 text-sm">
          <div className="rounded-lg bg-[var(--bg)] px-3 py-2">
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              Véhicule
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--fg)]">
              {VEHICLE_ICONS[transporter.vehicle_type]}{" "}
              {VEHICLE_LABELS[transporter.vehicle_type]}
            </dd>
          </div>
          <div className="rounded-lg bg-[var(--bg)] px-3 py-2">
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              Capacité
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--fg)]">
              {transporter.capacity_kg.toLocaleString()} kg
            </dd>
          </div>
          <div className="rounded-lg bg-[var(--bg)] px-3 py-2 col-span-2">
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              Tarif
            </dt>
            <dd className="mt-0.5 font-semibold text-[var(--fg)]">
              <span className="text-secondary text-base">
                {transporter.price_per_km.toLocaleString()} DZD
              </span>
              <span className="text-[var(--fg-muted)] font-normal"> / km</span>
            </dd>
          </div>
        </dl>

        {/* ── Description ── */}
        {transporter.description && (
          <p className="line-clamp-2 text-sm text-[var(--fg-muted)]">
            {transporter.description}
          </p>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
          <a
            href={`tel:${transporter.phone}`}
            id={`call-transporter-${transporter.id}`}
            className="btn-outline btn-sm flex-1 text-center"
          >
            📞 Appeler
          </a>
          <Link
            href={`/transporters/${transporter.id}`}
            id={`view-transporter-${transporter.id}`}
            className="btn-primary btn-sm flex-1 text-center"
          >
            Voir profil
          </Link>
        </div>
      </div>
    </article>
  );
}
