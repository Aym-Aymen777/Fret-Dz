// ─────────────────────────────────────────────
//  Fret-DZ  |  Landing / Home Page
//  Server Component — redirects authenticated
//  users to dashboard, shows marketing hero otherwise
// ─────────────────────────────────────────────
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      {/* ── Background decoration ── */}
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-40" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

      {/* ── Navbar ── */}
      <header className="relative z-navbar border-b border-[var(--border)] glass">
        <nav className="page-container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <span className="text-sm font-black text-white">F</span>
            </div>
            <span className="font-display text-xl font-bold text-[var(--fg)]">
              Fret<span className="text-gradient-primary">-DZ</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost btn-sm">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary btn-sm">
              Commencer gratuitement
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="page-container section relative pt-24 pb-32 text-center">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-secondary" />
            Plateforme B2B de fret — Algérie
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight text-[var(--fg)] md:text-6xl">
            Expédiez vos marchandises{" "}
            <span className="text-gradient-primary">partout en Algérie</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-[var(--fg-muted)]">
            Fret-DZ connecte les entreprises algériennes avec des transporteurs
            certifiés pour une livraison rapide et fiable dans les 58 wilayas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-primary btn-lg">
              Créer un compte
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/login" className="btn-outline btn-lg">
              Se connecter
            </Link>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            { label: "Transporteurs actifs", value: "500+" },
            { label: "Wilayas couvertes", value: "58/58" },
            { label: "Expéditions livrées", value: "12 000+" },
          ].map((stat) => (
            <div key={stat.label} className="card card-body text-center">
              <p className="font-display text-3xl font-black text-gradient-primary">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
