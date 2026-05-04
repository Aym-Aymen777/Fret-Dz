"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  useTransporterShipments hook
//
//  Returns two separate lists:
//  - pendingShipments : ALL pending shipments (visible via RLS)
//  - myShipments      : Non-pending shipments assigned to this transporter
//
//  BUG-11 FIX: realtime channel now uses a scoped channel name and
//  does not broadcast every shipment mutation to every connected client.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback,useRef } from "react";
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
  myShipments: Shipment[]
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

  const isFetchingRef = useRef(false);

  const fetchShipments = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    setLoading(true);
    setError(null);

    // ── 1. All pending shipments (visible to every transporter via RLS) ──────
    console.log("[useTransporterShipments] Fetching pending shipments...");
    const { data: pendingData, error: pendingErr } = await supabase
      .from("shipments")
      .select(CLIENT_SELECT)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (pendingErr) {
      if (mountedRef.current) {
        setError(pendingErr.message);
        setLoading(false);
      }
      isFetchingRef.current = false;
      return;
    }

    if (!mountedRef.current) return;
    setPendingShipments((pendingData as unknown as Shipment[]) ?? []);

    // ── 2. This transporter's own non-pending shipments ──────────────────────
    if (transporterId) {
      console.log("[useTransporterShipments] Fetching my shipments for ID:", transporterId);
      const { data: myData, error: myErr } = await supabase
        .from("shipments")
        .select(CLIENT_SELECT)
        .eq("transporter_id", transporterId)
        .neq("status", "pending")
        .order("created_at", { ascending: false });

      if (myErr) {
        if (mountedRef.current) setError(myErr.message);
      } else {
        if (mountedRef.current) setMyShipments((myData as unknown as Shipment[]) ?? []);
      }
    } else {
      if (mountedRef.current) setMyShipments([]);
    }

    if (mountedRef.current) setLoading(false);
    isFetchingRef.current = false;
  }, [supabase, transporterId]);
  // Keep fetchShipmentsRef updated so real-time callbacks always use the latest version
  const fetchShipmentsRef = useRef(fetchShipments);
  useEffect(() => {
    fetchShipmentsRef.current = fetchShipments;
  }, [fetchShipments]);

  /**
   * Generic status update (in_transit, delivered, rejected).
   * For accepting a pending shipment use the server action acceptShipmentAction
   * which also sets transporter_id (required to satisfy RLS).
   */
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

      // BUG-4 FIX: add .select("id") to detect silent RLS failures.
      // Supabase returns { data: [], error: null } when a row-level policy
      // blocks the update — no error, but 0 rows affected.  Without .select()
      // the old code saw error=null, called toast.success(), and refreshed the
      // list — but the database was never changed.
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

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transporterId]); 


  // BUG-11 FIX: realtime subscription scoped to pending shipments only.
  // We cannot filter by transporter_id=eq.X for pending rows (they have
  // transporter_id = NULL), so we subscribe to status=eq.pending for the
  // global feed and to transporter_id=eq.transporterId for assigned ones.
  // Each channel is independent and only refetches when truly relevant.
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
