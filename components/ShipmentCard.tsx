"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  ShipmentCard Component
// ─────────────────────────────────────────────
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { Shipment } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import { deleteShipmentAction } from "@/app/(dashboard)/dashboard/actions";

interface ShipmentCardProps {
  shipment: Shipment;
  onDeleted?: (id: string) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DELETABLE_STATUSES = ["delivered", "rejected"] as const;

export default function ShipmentCard({ shipment, onDeleted }: ShipmentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = DELETABLE_STATUSES.includes(
    shipment.status as (typeof DELETABLE_STATUSES)[number]
  );

  function handleDeleteClick() {
    setDeleteError(null);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      const { error } = await deleteShipmentAction(shipment.id);
      if (error) {
        setDeleteError(error);
        setConfirmOpen(false);
      } else {
        setConfirmOpen(false);
        onDeleted?.(shipment.id);
      }
    });
  }

  return (
    <>
      <article className="card-hover group flex flex-col gap-4 p-5 animate-fade-in relative">
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
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={shipment.status} />
            {canDelete && (
              <button
                onClick={handleDeleteClick}
                id={`delete-shipment-${shipment.id}`}
                title="Supprimer l'expédition"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 text-danger opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/20"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Route visualization ── */}
        <div className="flex items-center gap-2 rounded-xl bg-[var(--bg)] px-4 py-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-primary-500/20" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Départ</p>
            <p className="truncate text-sm font-semibold text-[var(--fg)]">{shipment.origin}</p>
          </div>

          <div className="flex flex-col items-center shrink-0 mx-1">
            <div className="flex items-center gap-0.5">
              <div className="h-px w-6 bg-[var(--border)]" />
              <svg className="h-3 w-3 text-[var(--fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <span className="mt-0.5 text-2xs text-[var(--fg-muted)]">{shipment.weight_kg} kg</span>
          </div>

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
          {shipment.estimated_price != null && (
            <div>
              <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Prix estimé</dt>
              <dd className="font-semibold text-secondary">
                {shipment.estimated_price?.toLocaleString() ?? 0} DZD
              </dd>
            </div>
          )}
          {shipment.pickup_date && (
            <div>
              <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Enlèvement</dt>
              <dd className="font-semibold text-[var(--fg)]">{formatDate(shipment.pickup_date)}</dd>
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

        {/* ── Delete error ── */}
        {deleteError && (
          <p className="text-xs text-danger border border-danger/20 bg-danger/10 rounded-lg px-3 py-2">
            ⚠️ {deleteError}
          </p>
        )}
      </article>

      {/* ── Confirm dialog — portaled to document.body to escape any clipping parent ── */}
      {confirmOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmOpen(false);
            }}
          >
            <div className="card card-body w-full max-w-xs space-y-4 shadow-2xl animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-lg">
                  🗑️
                </div>
                <div>
                  <h3 className="font-bold text-[var(--fg)]">Supprimer l'expédition</h3>
                  <p className="text-xs text-[var(--fg-muted)]">Cette action est irréversible.</p>
                </div>
              </div>

              {/* Shipment name */}
              <p className="text-sm text-[var(--fg-muted)] rounded-lg bg-[var(--bg)] px-3 py-2">
                Supprimer{" "}
                <span className="font-semibold text-[var(--fg)]">«&nbsp;{shipment.title}&nbsp;»</span> ?
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={isPending}
                  className="btn-outline flex-1 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  id={`confirm-delete-${shipment.id}`}
                  className="flex-1 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger/90 disabled:opacity-60"
                >
                  {isPending ? "…" : "Supprimer"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
