// ─────────────────────────────────────────────
//  Fret-DZ  |  Transporters List Page
//  Server Component
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TransporterCard from "@/components/TransporterCard";
import type { Transporter } from "@/lib/types";

export const metadata: Metadata = { title: "Transporteurs" };

async function getTransporters(): Promise<Transporter[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transporters")
    .select("*")
    .order("rating", { ascending: false });
  return (data as Transporter[]) ?? [];
}

export default async function TransportersPage() {
  const transporters = await getTransporters();
  const available    = transporters.filter((t) => t.is_available).length;

  return (
    <section className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-black text-[var(--fg)]">
          Transporteurs
        </h1>
        <p className="mt-1 text-[var(--fg-muted)]">
          {available} transporteur{available !== 1 ? "s" : ""} disponible{available !== 1 ? "s" : ""}{" "}
          sur {transporters.length}
        </p>
      </div>

      {/* Filter bar (static — upgrade to client filter later) */}
      <div className="flex flex-wrap gap-2">
        {["Tous", "Fourgon", "Camion", "Semi-remorque", "Pickup"].map((label, i) => (
          <button
            key={label}
            id={`filter-${label.toLowerCase()}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 border
              ${i === 0
                ? "bg-primary-500 text-white border-primary-500"
                : "border-[var(--border)] text-[var(--fg-muted)] hover:border-primary-500/50 hover:text-primary-500"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {transporters.length === 0 ? (
        <div className="card card-body flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🚛</span>
          <p className="text-base font-semibold text-[var(--fg)]">Aucun transporteur trouvé</p>
          <p className="text-sm text-[var(--fg-muted)]">Revenez bientôt — notre réseau grandit chaque jour.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {transporters.map((t) => (
            <TransporterCard key={t.id} transporter={t} />
          ))}
        </div>
      )}
    </section>
  );
}
