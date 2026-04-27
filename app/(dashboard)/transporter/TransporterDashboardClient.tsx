"use client";

import React, { useState } from "react";
import type { Transporter, Shipment } from "@/lib/types";
import { useTransporterShipments } from "@/hooks/useTransporterShipments";
import { useToast } from "@/components/ToastProvider";
import TransporterShipmentCard from "@/components/TransporterShipmentCard";
import ShipmentDetailsModal from "@/components/ShipmentDetailsModal";
import RejectionModal from "@/components/RejectionModal";

interface Props {
  transporter: Transporter | null;
}

export default function TransporterDashboardClient({ transporter }: Props) {
  const { shipments, loading, updateShipmentStatus } = useTransporterShipments(transporter?.id);
  const toast = useToast();

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [shipmentToReject, setShipmentToReject] = useState<Shipment | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Stats
  const pendingCount = shipments.filter(s => s.status === "pending").length;
  const acceptedCount = shipments.filter(s => s.status === "accepted").length;
  const inTransitCount = shipments.filter(s => s.status === "in_transit").length;

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailsModalOpen(true);
  };

  const handleAccept = async (shipment: Shipment) => {
    if (!confirm(`Êtes-vous sûr de vouloir accepter l'expédition "${shipment.title}" ?`)) return;
    
    setIsUpdatingId(shipment.id);
    const { error } = await updateShipmentStatus(shipment.id, "accepted");
    setIsUpdatingId(null);
    
    if (error) {
      toast.error("Erreur lors de l'acceptation: " + error);
    } else {
      toast.success("Expédition acceptée avec succès !");
    }
  };

  const handleRejectClick = (shipment: Shipment) => {
    setShipmentToReject(shipment);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!shipmentToReject) return;
    
    setIsUpdatingId(shipmentToReject.id);
    const { error } = await updateShipmentStatus(shipmentToReject.id, "rejected", reason);
    setIsUpdatingId(null);
    
    if (error) {
      toast.error("Erreur lors du rejet: " + error);
    } else {
      toast.success("Expédition rejetée.");
      setShipmentToReject(null);
    }
  };

  const handleUpdateStatus = async (shipment: Shipment, newStatus: Shipment["status"]) => {
    setIsUpdatingId(shipment.id);
    const { error } = await updateShipmentStatus(shipment.id, newStatus);
    setIsUpdatingId(null);
    
    if (error) {
      toast.error("Erreur lors de la mise à jour: " + error);
    } else {
      const statusLabels = {
        in_transit: "en transit",
        delivered: "livrée"
      };
      toast.success(`Statut mis à jour : ${statusLabels[newStatus as keyof typeof statusLabels]}`);
    }
  };

  return (
    <div className="space-y-8">
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
        <h2 className="mb-4 font-display text-xl font-bold text-[var(--fg)] flex items-center gap-2">
          Expéditions à traiter
          {pendingCount > 0 && (
            <span className="bg-warning text-white text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </h2>
        
        {loading && shipments.length === 0 ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pendingCount === 0 ? (
          <div className="card card-body flex flex-col items-center gap-4 py-12 text-center border-dashed">
            <span className="text-5xl opacity-50">😴</span>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-[var(--fg)]">
                Tout est à jour
              </p>
              <p className="text-sm text-[var(--fg-muted)]">
                Vous n'avez aucune nouvelle assignation en attente.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shipments.filter(s => s.status === "pending").map((shipment) => (
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
        
        {loading && shipments.length === 0 ? null : (acceptedCount + inTransitCount) === 0 ? (
          <div className="text-center py-8 text-[var(--fg-muted)] text-sm">
            Aucune expédition en cours.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shipments.filter(s => s.status === "accepted" || s.status === "in_transit").map((shipment) => (
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
      {shipments.some(s => s.status === "delivered") && (
        <div className="pt-8 opacity-70">
          <h2 className="mb-4 font-display text-lg font-bold text-[var(--fg)]">
            Historique récent (Livré)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shipments.filter(s => s.status === "delivered").slice(0, 3).map((shipment) => (
              <TransporterShipmentCard
                key={shipment.id}
                shipment={shipment}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
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
