"use server";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Dashboard Server Actions
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteShipmentAction(
  shipmentId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // ── Auth guard ────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // ── Ownership + status check ──────────────────
  // Only the owner can delete, and only delivered/rejected shipments
  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("id, status, client_id")
    .eq("id", shipmentId)
    .eq("client_id", user.id)         // must be the owner
    .in("status", ["delivered", "rejected"]) // only terminal statuses
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!shipment) {
    return {
      error:
        "Expédition introuvable, non autorisée, ou ne peut pas être supprimée dans ce statut.",
    };
  }

  // ── Hard delete ───────────────────────────────
  const { error: deleteError } = await supabase
    .from("shipments")
    .delete()
    .eq("id", shipmentId)
    .eq("client_id", user.id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/dashboard");
  return { error: null };
}