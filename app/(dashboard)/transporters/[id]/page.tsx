// ─────────────────────────────────────────────
//  Fret-DZ  |  Transporter Detail Page
//  Server Component — dynamic route [id]
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/StatusBadge";
import type { Transporter } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transporters")
    .select("company_name")
    .eq("id", id)
    .single();
  return { title: data?.company_name ?? "Transporteur" };
}

const VEHICLE_LABELS: Record<string, string> = {
  van: "Fourgon", truck: "Camion", semi: "Semi-remorque",
  pickup: "Pickup", motorcycle: "Moto",
};

export default async function TransporterDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("transporters")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const t = data as Transporter;

  return (
    <section className="animate-fade-in mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link href="/transporters" className="btn-ghost btn-sm inline-flex -ml-2">
        ← Retour aux transporteurs
      </Link>

      {/* Hero card */}
      <div className="card overflow-hidden">
        {/* Gradient banner */}
        <div className="h-32 bg-gradient-to-r from-primary-500 to-accent" />

        <div className="card-body -mt-10 space-y-4">
          {/* Avatar + name */}
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-[var(--surface)] bg-[var(--bg)] text-4xl shadow-lg">
              {t.logo_url ? (
                <img src={t.logo_url} alt={t.company_name} className="h-full w-full rounded-xl object-cover" />
              ) : "🚛"}
            </div>
            <div className="pb-1">
              <h1 className="font-display text-2xl font-black text-[var(--fg)]">
                {t.company_name}
              </h1>
              <p className="text-[var(--fg-muted)]">{t.wilaya} · {t.phone}</p>
            </div>
            <div className="ml-auto pb-1">
              <span className={`badge ${t.is_available
                ? "bg-success/10 text-emerald-700 dark:text-emerald-300 border border-success/30"
                : "bg-muted-100 dark:bg-muted-800 text-[var(--fg-muted)] border border-[var(--border)]"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${t.is_available ? "bg-success" : "bg-muted-400"}`} />
                {t.is_available ? "Disponible" : "Indisponible"}
              </span>
            </div>
          </div>

          {/* Description */}
          {t.description && (
            <p className="text-[var(--fg-muted)]">{t.description}</p>
          )}

          {/* Stats grid */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Véhicule",  value: VEHICLE_LABELS[t.vehicle_type] ?? t.vehicle_type },
              { label: "Capacité",  value: `${t.capacity_kg?.toLocaleString() ?? 0} kg` },
              { label: "Tarif/km", value: `${t.price_per_km?.toLocaleString() ?? 0} DZD` },
              { label: "Note",      value: `⭐ ${t.rating.toFixed(1)} (${t.rating_count})` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[var(--bg)] px-4 py-3">
                <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
                  {item.label}
                </dt>
                <dd className="mt-1 font-bold text-[var(--fg)]">{item.value}</dd>
              </div>
            ))}
          </dl>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
            <a href={`tel:${t.phone}`} id="call-cta" className="btn-outline flex-1">
              📞 Appeler
            </a>
            <Link href="/create-shipment" id="book-cta" className="btn-primary flex-1">
              Créer une expédition avec ce transporteur →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
