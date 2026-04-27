"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  useTransporterShipments hook
//  Fetches & manages shipments assigned to the
//  current transporter in real-time.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shipment, Transporter } from "@/lib/types";

interface UseTransporterShipmentsReturn {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateShipmentStatus: (
    id: string,
    status: Shipment["status"],
    rejectionReason?: string
  ) => Promise<{ error: string | null }>;
}

export function useTransporterShipments(transporterId?: string): UseTransporterShipmentsReturn {
  const supabase = createClient();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    if (!transporterId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("shipments")
      .select(
        `
        *,
        client:profiles!shipments_client_id_fkey (
          full_name,
          phone,
          company_name
        )
      `
      )
      .eq("transporter_id", transporterId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setShipments((data as unknown as Shipment[]) ?? []);
    }

    setLoading(false);
  }, [supabase, transporterId]);

  const updateShipmentStatus = useCallback(
    async (id: string, status: Shipment["status"], rejectionReason?: string) => {
      const updates: Partial<Shipment> = {
        status,
        updated_at: new Date().toISOString(),
      };
      
      if (rejectionReason && status === "rejected") {
        updates.rejection_reason = rejectionReason;
      }

      const { error: updateError } = await supabase
        .from("shipments")
        .update(updates)
        .eq("id", id);

      if (updateError) return { error: updateError.message };

      await fetchShipments();
      return { error: null };
    },
    [supabase, fetchShipments]
  );

  useEffect(() => {
    fetchShipments();

    if (!transporterId) return;

    const channel = supabase
      .channel("transporter-shipments-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "shipments",
          filter: `transporter_id=eq.${transporterId}`
        },
        () => fetchShipments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transporterId, fetchShipments, supabase]);

  return { shipments, loading, error, refresh: fetchShipments, updateShipmentStatus };
}
