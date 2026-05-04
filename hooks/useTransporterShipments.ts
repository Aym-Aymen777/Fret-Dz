"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shipment } from "@/lib/types";

const CLIENT_SELECT = `
  *,
  client:profiles!client_id (
    full_name,
    phone,
    company_name,
    avatar_url
  )
`;

export interface UseTransporterShipmentsReturn {
  pendingShipments: Shipment[];
  myShipments: Shipment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateShipmentStatus: (
    id: string,
    status: Shipment["status"],
    rejectionReason?: string
  ) => Promise<{ error: string | null }>;
}

export function useTransporterShipments(
  transporterId?: string
): UseTransporterShipmentsReturn {
  const [supabase] = useState(() => createClient());
  const [pendingShipments, setPendingShipments] = useState<Shipment[]>([]);
  const [myShipments, setMyShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // BUG-1 FIX: moved BELOW setLoading so the guard never traps loading=true
  const isFetchingRef = useRef(false);

  const fetchShipments = useCallback(async () => {
    // BUG-1 FIX: guard checked BEFORE setLoading — never sets loading=true
    // if we're going to bail out immediately
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      // ── 1. All pending shipments ─────────────────────────────────────────
      const { data: pendingData, error: pendingErr } = await supabase
        .from("shipments")
        .select(CLIENT_SELECT)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!mountedRef.current) return; // BUG-1 FIX: isFetchingRef reset in finally

      if (pendingErr) {
        setError(pendingErr.message);
        return;
      }

      setPendingShipments((pendingData as unknown as Shipment[]) ?? []);

      // ── 2. This transporter's own non-pending shipments ──────────────────
      if (transporterId) {
        const { data: myData, error: myErr } = await supabase
          .from("shipments")
          .select(CLIENT_SELECT)
          .eq("transporter_id", transporterId)
          .neq("status", "pending")
          .order("created_at", { ascending: false });

        if (!mountedRef.current) return;

        if (myErr) {
          setError(myErr.message);
        } else {
          setMyShipments((myData as unknown as Shipment[]) ?? []);
        }
      } else {
        setMyShipments([]);
      }
    } finally {
      // BUG-1 FIX: ALWAYS reset both flags, even if we returned early above
      isFetchingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase, transporterId]);

  const fetchShipmentsRef = useRef(fetchShipments);
  useEffect(() => {
    fetchShipmentsRef.current = fetchShipments;
  }, [fetchShipments]);

  const updateShipmentStatus = useCallback(
    async (
      id: string,
      status: Shipment["status"],
      rejectionReason?: string
    ) => {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (rejectionReason && status === "rejected") {
        updates.rejection_reason = rejectionReason;
      }

      const { data: updated, error: updateError } = await supabase
        .from("shipments")
        .update(updates)
        .eq("id", id)
        .select("id");

      if (updateError) return { error: updateError.message };
      if (!updated || updated.length === 0) {
        return { error: "Mise à jour non autorisée ou expédition introuvable" };
      }

      await fetchShipments();
      return { error: null };
    },
    [supabase, fetchShipments]
  );

  // BUG-2 FIX: depend on fetchShipments (stable via useCallback) not just transporterId
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // ── Realtime: pending feed ────────────────────────────────────────────────
  useEffect(() => {
    const pendingChannel = supabase
      .channel("transporter-pending-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments", filter: "status=eq.pending" },
        () => fetchShipmentsRef.current()
      )
      .subscribe();

    return () => { supabase.removeChannel(pendingChannel); };
  }, [supabase]);

  // ── Realtime: assigned shipments ─────────────────────────────────────────
  useEffect(() => {
    if (!transporterId) return;

    const myChannel = supabase
      .channel(`transporter-mine-rt-${transporterId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shipments", filter: `transporter_id=eq.${transporterId}` },
        () => fetchShipmentsRef.current()
      )
      .subscribe();

    return () => { supabase.removeChannel(myChannel); };
  }, [supabase, transporterId]);

  return {
    pendingShipments,
    myShipments,
    loading,
    error,
    refresh: fetchShipments,
    updateShipmentStatus,
  };
}