// ─────────────────────────────────────────────
//  Fret-DZ  |  ShipmentCard Component
//  Server-safe presentational component
// ─────────────────────────────────────────────
import type { Shipment } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface ShipmentCardProps {
  shipment: Shipment;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ShipmentCard({ shipment }: ShipmentCardProps) {
  return (
    <article className="card-hover group flex flex-col gap-4 p-5 animate-fade-in">
      {/* ── Top row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[var(--fg)] group-hover:text-primary-500 transition-colors">
            {shipment.title}
          </h3>
          <p className="text-sm text-[var(--fg-muted)]">
            Créé le {formatDate(shipment.created_at)}
          </p>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {/* ── Route visualization ── */}
      <div className="flex items-center gap-2 rounded-xl bg-[var(--bg)] px-4 py-3">
        {/* Origin */}
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-primary-500/20" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Départ</p>
          <p className="truncate text-sm font-semibold text-[var(--fg)]">{shipment.origin}</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center shrink-0 mx-1">
          <div className="flex items-center gap-0.5">
            <div className="h-px w-6 bg-[var(--border)]" />
            <svg className="h-3 w-3 text-[var(--fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <span className="mt-0.5 text-2xs text-[var(--fg-muted)]">
            {shipment.weight_kg} kg
          </span>
        </div>

        {/* Destination */}
        <div className="min-w-0 flex-1 text-right">
          <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Arrivée</p>
          <p className="truncate text-sm font-semibold text-[var(--fg)]">{shipment.destination}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-secondary/20" />
        </div>
      </div>

      {/* ── Meta grid ── */}
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {shipment.estimated_price !== undefined && (
          <div>
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Prix estimé</dt>
            <dd className="font-semibold text-secondary">
              {shipment.estimated_price.toLocaleString()} DZD
            </dd>
          </div>
        )}

        {shipment.pickup_date && (
          <div>
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Enlèvement</dt>
            <dd className="font-semibold text-[var(--fg)]">
              {formatDate(shipment.pickup_date)}
            </dd>
          </div>
        )}

        {shipment.transporter && (
          <div>
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Transporteur</dt>
            <dd className="truncate font-semibold text-[var(--fg)]">
              {shipment.transporter.company_name}
            </dd>
          </div>
        )}
      </dl>

      {/* ── Document link ── */}
      {shipment.document_url && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
          <svg className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="flex-1 truncate text-[var(--fg-muted)]">Document joint</span>
          <a
            href={shipment.document_url}
            target="_blank"
            rel="noopener noreferrer"
            id={`doc-download-${shipment.id}`}
            className="text-xs font-semibold text-primary-500 hover:underline"
          >
            Télécharger ↗
          </a>
        </div>
      )}
    </article>
  );
}
