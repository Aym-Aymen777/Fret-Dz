"use server";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Transporter Server Actions
//
//  WHY server actions for accept / reject?
//  Pending shipments have transporter_id = NULL.
//  The client-side RLS policy "transporter can update assigned" only allows
//  updates where transporter_id is ALREADY set to this transporter.
//  So both accept (sets transporter_id) and reject (status change on a row
//  the transporter doesn't own yet) must go through server actions that
//  verify ownership via auth.uid() before writing.
//
//  REQUIRED SQL policies (run once in Supabase SQL editor):
//  See migration.sql for the full policy definitions.
// ─────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function acceptShipmentAction(
  shipmentId: string,
  transporterId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // ── Auth guard ────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // ── Ownership check: make sure the transporter belongs to current user ────
  const { data: transporter, error: tErr } = await supabase
    .from("transporters")
    .select("id")
    .eq("id", transporterId)
    .eq("profile_id", user.id)
    .single();

  if (tErr || !transporter) {
    return { error: "Profil transporteur introuvable ou non autorisé" };
  }

  // ── Accept the shipment (sets transporter_id + changes status) ────────────
  // BUG-4 FIX: add .select("id") to detect silent RLS failures.
  // When RLS blocks an update, Supabase returns { data: [], error: null } —
  // no error, but 0 rows affected. Without .select(), we can't tell the
  // difference between success and a silently-blocked write.
  const { data: updated, error } = await supabase
    .from("shipments")
    .update({
      status: "accepted",
      transporter_id: transporterId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .eq("status", "pending") // safety: only accept truly-pending ones
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Expédition introuvable, déjà acceptée, ou non autorisée" };
  }

  revalidatePath("/transporter");
  return { error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
//  rejectShipmentAction — BUG-4 FIX
//
//  Rejecting a PENDING shipment requires a server action because the
//  client-side Supabase call can't satisfy "transporter can update assigned"
//  (pending rows have transporter_id = NULL so no assignment exists yet).
//  This action verifies ownership server-side then writes directly.
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectShipmentAction(
  shipmentId: string,
  transporterId: string,
  reason: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // ── Auth guard ────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  // ── Ownership check ───────────────────────────────────────────────────────
  const { data: transporter, error: tErr } = await supabase
    .from("transporters")
    .select("id")
    .eq("id", transporterId)
    .eq("profile_id", user.id)
    .single();

  if (tErr || !transporter) {
    return { error: "Profil transporteur introuvable ou non autorisé" };
  }

  // ── Reject the pending shipment ───────────────────────────────────────────
  const { data: updated, error } = await supabase
    .from("shipments")
    .update({
      status: "rejected",
      rejection_reason: reason.trim() || "Rejeté par le transporteur",
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .eq("status", "pending")
    .select("id");

  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Expédition introuvable, déjà traitée, ou non autorisée" };
  }

  revalidatePath("/transporter");
  return { error: null };
}
