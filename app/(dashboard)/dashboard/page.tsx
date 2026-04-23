// ─────────────────────────────────────────────
//  Fret-DZ  |  Dashboard Page
//  Server Component — fetches shipments server-side
//  then renders client widgets below
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShipmentCard from "@/components/ShipmentCard";
import StatusBadge from "@/components/StatusBadge";
import type { Shipment, ShipmentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_COUNTS: ShipmentStatus[] = [
  "pending", "accepted", "in_transit", "delivered", "rejected",
];

async function getShipments(userId: string): Promise<Shipment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("*, transporter:transporters(id,company_name,vehicle_type,rating,logo_url,phone,wilaya)")
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as Shipment[]) ?? [];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const shipments = user ? await getShipments(user.id) : [];

  // Compute stats
  const stats = STATUS_COUNTS.reduce(
    (acc, s) => ({ ...acc, [s]: shipments.filter((sh) => sh.status === s).length }),
    {} as Record<ShipmentStatus, number>
  );

  const userName = (user?.user_metadata?.full_name as string) ?? user?.email ?? "Utilisateur";

  return (
    <section className="animate-fade-in space-y-8">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black text-[var(--fg)]">
            Bonjour, {userName.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-[var(--fg-muted)]">
            Voici un aperçu de vos expéditions
          </p>
        </div>
        <Link href="/create-shipment" className="btn-primary btn-lg">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle expédition
        </Link>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_COUNTS.map((status) => (
          <div key={status} className="card card-body flex flex-col gap-2">
            <StatusBadge status={status} size="sm" />
            <p className="font-display text-3xl font-black text-[var(--fg)]">
              {stats[status]}
            </p>
          </div>
        ))}
      </div>

      {/* ── Recent shipments ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-[var(--fg)]">
            Expéditions récentes
          </h2>
          <span className="text-sm text-[var(--fg-muted)]">{shipments.length} au total</span>
        </div>

        {shipments.length === 0 ? (
          <div className="card card-body flex flex-col items-center gap-4 py-16 text-center">
            <span className="text-5xl">📦</span>
            <div>
              <p className="text-base font-semibold text-[var(--fg)]">Aucune expédition encore</p>
              <p className="text-sm text-[var(--fg-muted)]">
                Créez votre première expédition pour commencer.
              </p>
            </div>
            <Link href="/create-shipment" className="btn-primary">
              Créer une expédition
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shipments.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick links ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/transporters"
          className="card card-hover card-body flex items-center gap-4 group"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-2xl group-hover:bg-primary-500/20 transition-colors">
            🚛
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">Explorer les transporteurs</p>
            <p className="text-sm text-[var(--fg-muted)]">Trouvez le meilleur transporteur pour votre cargaison</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-[var(--fg-muted)] group-hover:text-primary-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/create-shipment"
          className="card card-hover card-body flex items-center gap-4 group"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-2xl group-hover:bg-secondary/20 transition-colors">
            📋
          </div>
          <div>
            <p className="font-semibold text-[var(--fg)]">Nouvelle expédition</p>
            <p className="text-sm text-[var(--fg-muted)]">Créez et suivez votre expédition en temps réel</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-[var(--fg-muted)] group-hover:text-secondary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
