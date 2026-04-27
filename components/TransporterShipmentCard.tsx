"use client";

import React, { useState } from "react";
import type { Shipment } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  shipment: Shipment;
  onViewDetails: (shipment: Shipment) => void;
  onAccept?: (shipment: Shipment) => void;
  onReject?: (shipment: Shipment) => void;
  onUpdateStatus?: (shipment: Shipment, newStatus: Shipment["status"]) => void;
  isUpdating?: boolean;
}

export default function TransporterShipmentCard({ 
  shipment, 
  onViewDetails, 
  onAccept, 
  onReject,
  onUpdateStatus,
  isUpdating 
}: Props) {
  
  // Format date
  const createdDate = new Date(shipment.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="card card-body p-5 hover:shadow-lg transition-all duration-150 flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xl overflow-hidden shrink-0">
            {shipment.client?.avatar_url ? (
              <img src={shipment.client.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)] text-sm">{shipment.client?.full_name || "Client Inconnu"}</p>
            <p className="text-xs text-[var(--fg-muted)]">{createdDate}</p>
          </div>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {/* Body: Route & Details */}
      <div className="space-y-3 py-2 border-y border-[var(--border)]/50">
        <h3 className="font-bold text-[var(--fg)] truncate">{shipment.title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
          <span className="font-medium text-[var(--fg)]">{shipment.origin}</span>
          <span className="text-[var(--border)]">→</span>
          <span className="font-medium text-[var(--fg)]">{shipment.destination}</span>
        </div>
        
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-lg">⚖️</span>
            <span className="text-[var(--fg-muted)]">{shipment.weight_kg} kg</span>
          </div>
          {shipment.estimated_price && (
            <div className="flex items-center gap-1">
              <span className="text-lg">💰</span>
              <span className="text-[var(--fg-muted)]">{shipment.estimated_price} DZD</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 pt-2 mt-auto">
        <button
          type="button"
          onClick={() => onViewDetails(shipment)}
          className="btn-ghost flex-1 text-xs py-2"
        >
          Voir détails
        </button>

        {shipment.status === "pending" && (
          <>
            {onReject && (
              <button
                type="button"
                onClick={() => onReject(shipment)}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
              >
                Rejeter
              </button>
            )}
            {onAccept && (
              <button
                type="button"
                onClick={() => onAccept(shipment)}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success hover:text-white transition-colors"
              >
                Accepter
              </button>
            )}
          </>
        )}

        {shipment.status === "accepted" && onUpdateStatus && (
          <button
            type="button"
            onClick={() => onUpdateStatus(shipment, "in_transit")}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-info/10 text-info hover:bg-info hover:text-white transition-colors"
          >
            Marquer en transit
          </button>
        )}

        {shipment.status === "in_transit" && onUpdateStatus && (
          <button
            type="button"
            onClick={() => onUpdateStatus(shipment, "delivered")}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success hover:text-white transition-colors"
          >
            Marquer livré
          </button>
        )}
      </div>

    </div>
  );
}
