// ─────────────────────────────────────────────
//  Fret-DZ  |  Expeditions Index Page
//  Server Component — fetches all client shipments,
//  delegates filtering to ExpeditionsClient.
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExpeditionsClient from "./ExpeditionsClient";
import type { Shipment } from "@/lib/types";

export const metadata: Metadata = { title: "Mes expéditions" };

export default async function ExpeditionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "transporter") redirect("/transporter");

  const { data, error } = await supabase
    .from("shipments")
    .select("*, transporter:transporters(id,company_name,vehicle_type,rating,logo_url,phone,wilaya)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const shipments = (data as Shipment[]) ?? [];

  return (
    <section className="animate-fade-in space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-[var(--fg)]">
            Mes expéditions
          </h1>
          <p className="mt-1 text-[var(--fg-muted)]">
            {shipments.length} expédition{shipments.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link href="/create-shipment" className="btn-primary btn-lg">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle expédition
        </Link>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="text-lg">⚠️</span>
          <span>Erreur lors du chargement des expéditions : {error.message}</span>
        </div>
      )}

      {/* ── Filter + grid ── */}
      <ExpeditionsClient initialShipments={shipments} />
    </section>
  );
}
