// ─────────────────────────────────────────────
//  Fret-DZ  |  Shipment Detail Page
//  Server Component — dynamic route [id]
// ─────────────────────────────────────────────
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Shipment, VehicleType } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("title")
    .eq("id", id)
    .single();
  return { title: data?.title ?? "Expédition" };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const VEHICLE_ICONS: Record<VehicleType, string> = {
  van:        "🚐",
  truck:      "🚛",
  semi:       "🚚",
  pickup:     "🛻",
  motorcycle: "🏍️",
};

const VEHICLE_LABELS: Record<VehicleType, string> = {
  van:        "Fourgon",
  truck:      "Camion",
  semi:       "Semi-remorque",
  pickup:     "Pickup",
  motorcycle: "Moto",
};

const STATUS_STEPS = [
  { key: "pending",    label: "En attente" },
  { key: "accepted",   label: "Acceptée" },
  { key: "in_transit", label: "En transit" },
  { key: "delivered",  label: "Livrée" },
] as const;

type StatusStep = (typeof STATUS_STEPS)[number]["key"];

export default async function ShipmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("shipments")
    .select("*, transporter:transporters(id,company_name,vehicle_type,rating,logo_url,phone,wilaya,capacity_kg,price_per_km)")
    .eq("id", id)
    .single();

  if (!data) notFound();
  const s = data as Shipment;

  const isRejected = s.status === "rejected";
  const isDelivered = s.status === "delivered";
  const canDelete = isRejected || isDelivered;

  const currentStepIndex = STATUS_STEPS.findIndex((st) => st.key === s.status);

  return (
    <section className="animate-fade-in mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="btn-ghost btn-sm inline-flex -ml-2">
        ← Retour aux expéditions
      </Link>

      {/* ── Hero card ── */}
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary-500 to-accent" />
        <div className="card-body mt-4 space-y-5">
          {/* Title row */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black text-[var(--fg)]">
                {s.title}
              </h1>
              <p className="text-sm text-[var(--fg-muted)]">
                Créée le {formatDate(s.created_at)}
                {s.updated_at !== s.created_at && (
                  <> · Mise à jour le {formatDate(s.updated_at)}</>
                )}
              </p>
            </div>
            <StatusBadge status={s.status} size="md" />
          </div>

          {/* ── Progress timeline (hidden if rejected) ── */}
          {!isRejected && (
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div className={`h-0.5 flex-1 ${done ? "bg-primary-500" : "bg-[var(--border)]"}`} />
                      )}
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          active
                            ? "bg-primary-500 text-white ring-4 ring-primary-500/20"
                            : done
                            ? "bg-primary-500/20 text-primary-500"
                            : "bg-[var(--bg)] text-[var(--fg-muted)] border border-[var(--border)]"
                        }`}
                      >
                        {done && !active ? "✓" : i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 ${i < currentStepIndex ? "bg-primary-500" : "bg-[var(--border)]"}`} />
                      )}
                    </div>
                    <span className={`text-2xs text-center ${active ? "font-semibold text-primary-500" : "text-[var(--fg-muted)]"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Rejection notice ── */}
          {isRejected && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-danger">Expédition refusée</p>
              {s.rejection_reason && (
                <p className="text-sm text-[var(--fg-muted)]">
                  Motif : {s.rejection_reason}
                </p>
              )}
            </div>
          )}

          {/* ── Route ── */}
          <div className="flex items-center gap-3 rounded-xl bg-[var(--bg)] px-5 py-4">
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="h-3 w-3 rounded-full bg-primary-500 ring-2 ring-primary-500/20" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Départ</p>
              <p className="text-base font-bold text-[var(--fg)]">{s.origin}</p>
            </div>
            <div className="flex flex-col items-center shrink-0 gap-0.5 px-2">
              <svg className="h-4 w-4 text-[var(--fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="text-2xs text-[var(--fg-muted)]">{s.weight_kg} kg</span>
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Arrivée</p>
              <p className="text-base font-bold text-[var(--fg)]">{s.destination}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="h-3 w-3 rounded-full bg-secondary ring-2 ring-secondary/20" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Details grid ── */}
      <div className="card card-body space-y-5">
        <h2 className="font-display text-base font-bold text-[var(--fg)]">Détails de l&rsquo;expédition</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--bg)] px-4 py-3">
            <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Poids</dt>
            <dd className="mt-1 font-bold text-[var(--fg)]">{s.weight_kg} kg</dd>
          </div>
          {s.estimated_price != null && (
            <div className="rounded-xl bg-[var(--bg)] px-4 py-3">
              <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Prix estimé</dt>
              <dd className="mt-1 font-bold text-secondary">{s.estimated_price.toLocaleString()} DZD</dd>
            </div>
          )}
          {s.pickup_date && (
            <div className="rounded-xl bg-[var(--bg)] px-4 py-3">
              <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Date d&rsquo;enlèvement</dt>
              <dd className="mt-1 font-bold text-[var(--fg)]">{formatDate(s.pickup_date)}</dd>
            </div>
          )}
          {s.delivery_date && (
            <div className="rounded-xl bg-[var(--bg)] px-4 py-3">
              <dt className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Date de livraison</dt>
              <dd className="mt-1 font-bold text-[var(--fg)]">{formatDate(s.delivery_date)}</dd>
            </div>
          )}
        </dl>

        {s.description && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)] mb-1">Description</p>
            <p className="text-sm text-[var(--fg)] leading-relaxed rounded-xl bg-[var(--bg)] px-4 py-3">{s.description}</p>
          </div>
        )}
        {s.notes && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-[var(--fg-muted)] mb-1">Notes</p>
            <p className="text-sm text-[var(--fg)] leading-relaxed rounded-xl bg-[var(--bg)] px-4 py-3">{s.notes}</p>
          </div>
        )}

        {/* Document */}
        {s.document_url && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3">
            <svg className="h-5 w-5 shrink-0 text-[var(--fg-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-sm text-[var(--fg-muted)]">Document joint</span>
            <a
              href={s.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-sm"
            >
              Télécharger ↗
            </a>
          </div>
        )}
      </div>

      {/* ── Transporter card ── */}
      {s.transporter && (
        <div className="card card-body space-y-4">
          <h2 className="font-display text-base font-bold text-[var(--fg)]">Transporteur assigné</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--bg)] text-3xl border border-[var(--border)]">
              {s.transporter.logo_url ? (
                <img
                  src={s.transporter.logo_url}
                  alt={s.transporter.company_name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                VEHICLE_ICONS[s.transporter.vehicle_type as VehicleType] ?? "🚛"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--fg)]">{s.transporter.company_name}</p>
              <p className="text-sm text-[var(--fg-muted)]">
                {s.transporter.wilaya} · {VEHICLE_LABELS[s.transporter.vehicle_type as VehicleType] ?? s.transporter.vehicle_type}
              </p>
              <p className="text-sm text-[var(--fg-muted)]">⭐ {Number(s.transporter.rating).toFixed(1)}</p>
            </div>
            <a
              href={`tel:${s.transporter.phone}`}
              className="btn-outline btn-sm shrink-0"
            >
              📞 Appeler
            </a>
          </div>
          <Link
            href={`/transporters/${s.transporter.id}`}
            className="btn-ghost btn-sm w-full text-center"
          >
            Voir le profil complet →
          </Link>
        </div>
      )}

      {/* ── No transporter yet ── */}
      {!s.transporter && s.status === "pending" && (
        <div className="card card-body flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg)] text-2xl">
            🔍
          </div>
          <p className="font-semibold text-[var(--fg)]">En attente d&rsquo;un transporteur</p>
          <p className="text-sm text-[var(--fg-muted)] max-w-xs">
            Votre expédition est visible par les transporteurs. Vous serez notifié dès qu&rsquo;un transporteur accepte.
          </p>
          <Link href="/transporters" className="btn-primary btn-sm mt-1">
            Trouver un transporteur
          </Link>
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <Link href="/dashboard" className="btn-ghost btn-sm">
          ← Retour
        </Link>
        {canDelete && (
          <form
            action={async () => {
              "use server";
              const { createClient: cc } = await import("@/lib/supabase/server");
              const { redirect: rd } = await import("next/navigation");
              const sb = await cc();
              const { data: { user } } = await sb.auth.getUser();
              if (!user) return;
              await sb.from("shipments").delete().eq("id", id).eq("client_id", user.id);
              rd("/dashboard");
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20"
            >
              Supprimer l&rsquo;expédition
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
