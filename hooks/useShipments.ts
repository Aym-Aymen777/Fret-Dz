"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  useShipments hook
//  Fetches & manages the current user's shipments
//  from Supabase in real-time.
// ─────────────────────────────────────────────
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Shipment, CreateShipmentInput } from "@/lib/types";
import { deleteShipmentAction } from "@/app/(dashboard)/dashboard/actions";

interface UseShipmentsReturn {
  shipments: Shipment[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createShipment: (
    input: CreateShipmentInput,
  ) => Promise<{ error: string | null }>;
  deleteShipment: (shipmentId: string) => Promise<{ error: string | null }>;
}

export function useShipments(): UseShipmentsReturn {
  const [supabase] = useState(() => createClient());
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

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
      `,
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

  const backgroundUpload = useCallback(
    async (shipmentId: string, document: File, clientId: string) => {
      const ext = document.name.split(".").pop();
      const fileName = `${clientId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("shipment-documents")
        .upload(fileName, document, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        if (mountedRef.current) {
          setError(`Document upload failed: ${uploadError.message}`);
        }
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("shipment-documents")
        .getPublicUrl(fileName);

      const document_url = publicUrl.publicUrl;
      const { error: updateError } = await supabase
        .from("shipments")
        .update({ document_url })
        .eq("id", shipmentId);

      if (updateError) {
        if (mountedRef.current) {
          setError(`Document link update failed: ${updateError.message}`);
        }
      } else if (mountedRef.current) {
        setShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId
              ? { ...shipment, document_url }
              : shipment,
          ),
        );
      }
    },
    [supabase],
  );

  const createShipment = useCallback(
    async (input: CreateShipmentInput): Promise<{ error: string | null }> => {
      console.time("TOTAL");

      let currentUserId = userId;
      if (!currentUserId) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          console.timeEnd("TOTAL");
          return { error: "Not authenticated" };
        }
        currentUserId = userData.user.id;
        setUserId(currentUserId);
      }

      console.time("INSERT");
      const { data: insertedShipment, error: insertError } = await supabase
        .from("shipments")
        .insert({
          client_id: currentUserId,
          title: input.title,
          description: input.description,
          origin: input.origin,
          destination: input.destination,
          weight_kg: input.weight_kg,
          pickup_date: input.pickup_date,
          notes: input.notes,
          status: "pending",
        })
        .select()
        .single();
      console.timeEnd("INSERT");

      if (insertError || !insertedShipment) {
        console.timeEnd("TOTAL");
        return { error: insertError?.message ?? "Failed to create shipment" };
      }

      const optimisticShipment: Shipment = {
        id: insertedShipment.id,
        client_id: currentUserId,
        title: input.title,
        description: input.description,
        origin: input.origin,
        destination: input.destination,
        weight_kg: input.weight_kg,
        status: "pending",
        pickup_date: input.pickup_date,
        notes: input.notes,
        document_url: undefined,
        created_at: insertedShipment.created_at ?? new Date().toISOString(),
        updated_at:
          insertedShipment.updated_at ??
          insertedShipment.created_at ??
          new Date().toISOString(),
      };

      setShipments((prev) => [optimisticShipment, ...prev]);

      console.time("UPLOAD");
      if (input.document) {
        void backgroundUpload(
          optimisticShipment.id,
          input.document,
          currentUserId,
        );
      }
      console.timeEnd("UPLOAD");

      console.time("FETCH");
      console.timeEnd("FETCH");
      console.timeEnd("TOTAL");
      return { error: null };
    },
    [backgroundUpload, supabase, userId],
  );

  // ── Delete shipment (delivered / rejected only) ──
  const deleteShipment = useCallback(
    async (shipmentId: string): Promise<{ error: string | null }> => {
      const result = await deleteShipmentAction(shipmentId);
      if (!result.error) {
        // Optimistic removal from local state — revalidatePath handles SSR cache
        setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
      }
      return result;
    },
    [],
  );

  useEffect(() => {
    void (async () => {
      await fetchShipments();
    })();
  }, [fetchShipments]);

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
        () => fetchShipments(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchShipments]);

  return {
    shipments,
    loading,
    error,
    refresh: fetchShipments,
    createShipment,
    deleteShipment,
  };
}
