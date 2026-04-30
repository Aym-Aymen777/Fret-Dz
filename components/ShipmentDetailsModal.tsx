"use client";

import React, { useEffect, useRef } from "react";
import type { Shipment } from "@/lib/types";

interface Props {
  shipment: Shipment;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShipmentDetailsModal({ shipment, isOpen, onClose }: Props) {
  // BUG-14 FIX: auto-focus close button + Escape key listener
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Move focus into the modal
    closeRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Détails de l'expédition"
    >
      <div className="bg-[var(--bg)] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-panel">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-display font-bold text-[var(--fg)]">
            Détails de l&apos;expédition
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Header Info */}
          <div>
            <h3 className="text-2xl font-bold text-[var(--fg)] mb-1">{shipment.title}</h3>
            <p className="text-[var(--fg-muted)] font-mono text-sm">#{shipment.id.split('-')[0]}</p>
          </div>

          {/* Route */}
          <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)]">
            <h4 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
              Itinéraire
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-[var(--fg-muted)] mb-1">Origine</p>
                <p className="font-semibold text-[var(--fg)]">{shipment.origin}</p>
              </div>
              <div className="px-4 text-[var(--border)]">→</div>
              <div className="flex-1">
                <p className="text-sm text-[var(--fg-muted)] mb-1">Destination</p>
                <p className="font-semibold text-[var(--fg)]">{shipment.destination}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)]">
              <p className="text-sm text-[var(--fg-muted)] mb-1">Poids estimé</p>
              <p className="font-semibold text-[var(--fg)]">{shipment.weight_kg} kg</p>
            </div>
            {shipment.estimated_price && (
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)]">
                <p className="text-sm text-[var(--fg-muted)] mb-1">Prix estimé</p>
                <p className="font-semibold text-[var(--fg)]">{shipment.estimated_price} DZD</p>
              </div>
            )}
          </div>

          {/* Client Info */}
          {shipment.client && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-3">
                Informations du client
              </h4>
              <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--fg)]">
                  <span className="text-xl">👤</span>
                  <span className="font-medium">{shipment.client.full_name}</span>
                </div>
                {shipment.client.company_name && (
                  <div className="flex items-center gap-2 text-[var(--fg)]">
                    <span className="text-xl">🏢</span>
                    <span>{shipment.client.company_name}</span>
                  </div>
                )}
                {shipment.client.phone && (
                  <div className="flex items-center gap-2 text-[var(--fg)]">
                    <span className="text-xl">📞</span>
                    <a href={`tel:${shipment.client.phone}`} className="text-info hover:underline">
                      {shipment.client.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {shipment.notes && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Notes spéciales
              </h4>
              <p className="text-[var(--fg)] bg-[var(--surface)] p-4 rounded-lg border border-[var(--border)] text-sm">
                {shipment.notes}
              </p>
            </div>
          )}

          {/* Document */}
          {shipment.document_url && (
            <div>
              <h4 className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">
                Document joint
              </h4>
              <a
                href={shipment.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-lg hover:bg-info/20 transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger le document
              </a>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
