"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  useShipments hook
//  Fetches & manages the current user's shipments
//  from Supabase in real-time.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shipment, CreateShipmentInput } from "@/lib/types";

interface UseShipmentsReturn {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createShipment: (input: CreateShipmentInput) => Promise<{ error: string | null }>;
}

export function useShipments(): UseShipmentsReturn {
  const [supabase] = useState(() => createClient());
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // BUG-10 FIX: store userId in state so realtime filter can reference it
  const [userId, setUserId] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Store for the realtime subscription
    setUserId(userData.user.id);

    const { data, error: fetchError } = await supabase
      .from("shipments")
      .select(
        `
        *,
        transporter:transporters (
          id,
          company_name,
          vehicle_type,
          rating,
          logo_url,
          phone,
          wilaya
        )
      `
      )
      .eq("client_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setShipments((data as Shipment[]) ?? []);
    }

    setLoading(false);
  }, [supabase]);

  const createShipment = useCallback(
    async (input: CreateShipmentInput): Promise<{ error: string | null }> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { error: "Not authenticated" };

      let document_url: string | undefined;

      // ── Upload document if provided ──────────────
      if (input.document) {
        const ext = input.document.name.split(".").pop();
        const fileName = `${userData.user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("shipment-documents")
          .upload(fileName, input.document, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) return { error: uploadError.message };

        const { data: publicUrl } = supabase.storage
          .from("shipment-documents")
          .getPublicUrl(fileName);

        document_url = publicUrl.publicUrl;
      }

      // ── Insert shipment row ──────────────────────
      const { error: insertError } = await supabase.from("shipments").insert({
        client_id: userData.user.id,
        title: input.title,
        description: input.description,
        origin: input.origin,
        destination: input.destination,
        weight_kg: input.weight_kg,
        pickup_date: input.pickup_date,
        notes: input.notes,
        document_url,
        status: "pending",
      });

      if (insertError) return { error: insertError.message };

      await fetchShipments();
      return { error: null };
    },
    [supabase, fetchShipments]
  );

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // BUG-10 FIX: add row-level filter so only changes to this user's
  // shipments trigger a re-fetch — not every shipment in the system.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`shipments-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
          filter: `client_id=eq.${userId}`,
        },
        () => fetchShipments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchShipments]);

  return { shipments, loading, error, refresh: fetchShipments, createShipment };
}
