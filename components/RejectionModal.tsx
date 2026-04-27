"use client";

import React, { useState, useEffect, useRef } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

const REASONS = [
  "Je n'ai plus de capacité disponible",
  "La zone de livraison est hors de mon secteur",
  "Le type de marchandise ne correspond pas à mon véhicule",
  "Le prix estimé est insuffisant",
  "Indisponibilité à la date demandée",
  "Autre"
];

export default function RejectionModal({ isOpen, onClose, onConfirm, isSubmitting }: Props) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [otherReason, setOtherReason] = useState("");
  // BUG-14 FIX: ref for auto-focus
  const firstRadioRef = useRef<HTMLInputElement>(null);

  // Reset form state whenever the modal opens for a new shipment
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(REASONS[0]);
      setOtherReason("");
      // Auto-focus first radio button
      setTimeout(() => firstRadioRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // BUG-14 FIX: Escape key closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const reason = selectedReason === "Autre" ? otherReason : selectedReason;
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Rejeter l'expédition"
    >
      <div className="bg-[var(--bg)] w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-display font-bold text-[var(--fg)]">
            Rejeter l&apos;expédition
          </h2>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            Veuillez indiquer la raison de ce refus. Cela aidera le client.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {REASONS.map((reason, i) => (
              <label key={reason} className="flex items-center gap-3 cursor-pointer">
                <input
                  ref={i === 0 ? firstRadioRef : undefined}
                  type="radio"
                  name="reject-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  disabled={isSubmitting}
                />
                <span className="text-[var(--fg)] text-sm">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === "Autre" && (
            <textarea
              className="w-full mt-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] text-sm focus:ring-2 focus:ring-primary outline-none"
              rows={3}
              placeholder="Veuillez préciser la raison..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              disabled={isSubmitting}
            />
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--surface)]/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-ghost"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (selectedReason === "Autre" && !otherReason.trim())}
            className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {isSubmitting ? "Rejet en cours..." : "Confirmer le rejet"}
          </button>
        </div>
      </div>
    </div>
  );
}
