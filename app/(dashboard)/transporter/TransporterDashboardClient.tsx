"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Transporter Dashboard — Client Layer
//
//  FIXES applied:
//  B1  — destructure pendingShipments / myShipments (not the removed "shipments")
//  B2  — handleAccept now calls acceptShipmentAction (server action) to bypass RLS
//  B3  — loading guards now reference the correct arrays
//  B4  — stats computed from the two correct arrays
//  B5  — delivered history uses myShipments
//  B6  — active card list uses myShipments
//  B7  — transporter.id forwarded to acceptShipmentAction
//  B8  — error banner shown when hook returns an error
//  B9  — manual "Rafraîchir" button wired to refresh()
// ─────────────────────────────────────────────
import React, { useState } from "react";
import type { Transporter, Shipment } from "@/lib/types";
import { useTransporterShipments } from "@/hooks/useTransporterShipments";
import { useToast } from "@/components/ToastProvider";
import TransporterShipmentCard from "@/components/TransporterShipmentCard";
import ShipmentDetailsModal from "@/components/ShipmentDetailsModal";
import RejectionModal from "@/components/RejectionModal";
import { acceptShipmentAction, rejectShipmentAction } from "./actions";

interface Props {
  transporter: Transporter | null;
}

export default function TransporterDashboardClient({ transporter }: Props) {
  // B1 — correct destructuring of the refactored hook
  const {
    pendingShipments,
    myShipments,
    loading,
    error,
    refresh,
    updateShipmentStatus,
  } = useTransporterShipments(transporter?.id);

  const toast = useToast();

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [shipmentToReject, setShipmentToReject] = useState<Shipment | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // B4 — stats from the correct arrays
  const pendingCount   = pendingShipments.length;
  const acceptedCount  = myShipments.filter(s => s.status === "accepted").length;
  const inTransitCount = myShipments.filter(s => s.status === "in_transit").length;

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailsModalOpen(true);
  };

  // B2 + B7 — use the server action that can write transporter_id on pending rows
  const handleAccept = async (shipment: Shipment) => {
    if (!transporter) {
      toast.error("Profil transporteur introuvable.");
      return;
    }
    if (!confirm(`Êtes-vous sûr de vouloir accepter l'expédition « ${shipment.title} » ?`)) return;

    setIsUpdatingId(shipment.id);
    const { error: err } = await acceptShipmentAction(shipment.id, transporter.id);
    setIsUpdatingId(null);

    if (err) {
      toast.error("Erreur lors de l'acceptation : " + err);
    } else {
      toast.success("Expédition acceptée avec succès !");
      await refresh();
    }
  };

  const handleRejectClick = (shipment: Shipment) => {
    setShipmentToReject(shipment);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!shipmentToReject) return;
    if (!transporter) {
      toast.error("Profil transporteur introuvable.");
      return;
    }

    setIsUpdatingId(shipmentToReject.id);
    let err: string | null = null;

    if (shipmentToReject.status === "pending") {
      // BUG-4 FIX: pending rows have transporter_id=NULL so the client-side
      // RLS policy "transporter can update assigned" blocks this write.
      // Use the server action which verifies ownership then writes directly.
      const result = await rejectShipmentAction(
        shipmentToReject.id,
        transporter.id,
        reason
      );
      err = result.error;
    } else {
      // Accepted shipments: this transporter IS assigned, client-side RLS ok.
      const result = await updateShipmentStatus(
        shipmentToReject.id,
        "rejected",
        reason
      );
      err = result.error;
    }

    setIsUpdatingId(null);

    if (err) {
      toast.error("Erreur lors du rejet : " + err);
    } else {
      toast.success("Expédition rejetée.");
      setShipmentToReject(null);
      await refresh(); // BUG-4 FIX: refresh list so the rejected item disappears
    }
  };

  const handleUpdateStatus = async (shipment: Shipment, newStatus: Shipment["status"]) => {
    setIsUpdatingId(shipment.id);
    const { error: err } = await updateShipmentStatus(shipment.id, newStatus);
    setIsUpdatingId(null);

    if (err) {
      toast.error("Erreur lors de la mise à jour : " + err);
    } else {
      const statusLabels: Partial<Record<Shipment["status"], string>> = {
        in_transit: "en transit",
        delivered: "livrée",
      };
      toast.success(`Statut mis à jour : ${statusLabels[newStatus] ?? newStatus}`);
    }
  };

  return (
    <div className="space-y-8">

      {/* ── B8 Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="text-lg">⚠️</span>
          <span className="flex-1">{error}</span>
          {/* B9 — manual refresh */}
          <button
            onClick={refresh}
            className="shrink-0 rounded-lg bg-danger/20 px-3 py-1 text-xs font-semibold hover:bg-danger/30 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ── Quick Stats ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card card-body flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🔔</div>
          <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            En attente
          </p>
          <p className="font-display text-3xl font-black text-warning">{pendingCount}</p>
          <p className="text-sm text-[var(--fg-muted)]">Nouvelles assignations</p>
        </div>

        <div className="card card-body flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">✅</div>
          <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            Acceptées
          </p>
          <p className="font-display text-3xl font-black text-info">{acceptedCount}</p>
          <p className="text-sm text-[var(--fg-muted)]">En attente de ramassage</p>
        </div>

        <div className="card card-body flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">🚚</div>
          <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            En Transit
          </p>
          <p className="font-display text-3xl font-black text-accent">{inTransitCount}</p>
          <p className="text-sm text-[var(--fg-muted)]">Livraisons en cours</p>
        </div>
      </div>

      {/* ── Pending Shipments ── */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-[var(--fg)] flex items-center gap-2">
            Expéditions à traiter
            {pendingCount > 0 && (
              <span className="bg-warning text-white text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </h2>
          {/* B9 — manual refresh button */}
          <button
            onClick={refresh}
            disabled={loading}
            className="btn-ghost btn-sm flex items-center gap-1.5 text-xs"
            title="Rafraîchir la liste"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Rafraîchir
          </button>
        </div>

        {/* B3 — loading guard against correct array */}
        {loading && pendingShipments.length === 0 ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingCount === 0 ? (
          <div className="card card-body flex flex-col items-center gap-4 py-12 text-center border-dashed">
            <span className="text-5xl opacity-50">😴</span>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[var(--fg)]">Tout est à jour</p>
              <p className="text-sm text-[var(--fg-muted)]">
                Vous n'avez aucune nouvelle assignation en attente.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingShipments.map((shipment) => (
              <TransporterShipmentCard
                key={shipment.id}
                shipment={shipment}
                onViewDetails={handleViewDetails}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                isUpdating={isUpdatingId === shipment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Active Shipments (Accepted & In Transit) ── */}
      <div>
        <h2 className="mb-4 font-display text-xl font-bold text-[var(--fg)]">
          Expéditions actives
        </h2>

        {/* B3 + B6 — loading guard and correct source */}
        {loading && myShipments.length === 0 ? null : (acceptedCount + inTransitCount) === 0 ? (
          <div className="text-center py-8 text-[var(--fg-muted)] text-sm">
            Aucune expédition en cours.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* B6 — filter from myShipments */}
            {myShipments
              .filter(s => s.status === "accepted" || s.status === "in_transit")
              .map((shipment) => (
                <TransporterShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onViewDetails={handleViewDetails}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={isUpdatingId === shipment.id}
                />
              ))}
          </div>
        )}
      </div>

      {/* ── Completed Shipments ── */}
      {/* B5 — use myShipments */}
      {myShipments.some(s => s.status === "delivered") && (
        <div className="pt-8 opacity-70">
          <h2 className="mb-4 font-display text-lg font-bold text-[var(--fg)]">
            Historique récent (Livré)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myShipments
              .filter(s => s.status === "delivered")
              .slice(0, 3)
              .map((shipment) => (
                <TransporterShipmentCard
                  key={shipment.id}
                  shipment={shipment}
                  onViewDetails={handleViewDetails}
                />
              ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {selectedShipment && (
        <ShipmentDetailsModal
          shipment={selectedShipment}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}

      <RejectionModal
        isOpen={!!shipmentToReject}
        onClose={() => setShipmentToReject(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isUpdatingId === shipmentToReject?.id}
      />
    </div>
  );
}
