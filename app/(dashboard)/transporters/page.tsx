// ─────────────────────────────────────────────
//  Fret-DZ  |  Transporters List Page
//  Server Component — fetches initial data,
//  delegates filtering to TransportersClient.
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TransportersClient from "./TransportersClient";
import type { Transporter } from "@/lib/types";

export const metadata: Metadata = { title: "Transporteurs" };

async function getTransporters(): Promise<{ transporters: Transporter[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transporters")
    .select("*")
    .eq("is_available", true)
    .order("rating", { ascending: false });

  if (error) {
    console.error("[transporters/page] Supabase error:", error);
    return { transporters: [], error: error.message };
  }

  return { transporters: (data as Transporter[]) ?? [], error: null };
}

export default async function TransportersPage() {
  const { transporters, error } = await getTransporters();

  return (
    <section className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-black text-[var(--fg)]">
          Transporteurs
        </h1>
        <p className="mt-1 text-[var(--fg-muted)]">
          {transporters.length} transporteur{transporters.length !== 1 ? "s" : ""} disponible{transporters.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* DB error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          <span className="text-lg">⚠️</span>
          <span>Erreur lors du chargement des transporteurs : {error}</span>
        </div>
      )}

      {/* Delegate filter + grid to client component */}
      <TransportersClient initialTransporters={transporters} />
    </section>
  );
}