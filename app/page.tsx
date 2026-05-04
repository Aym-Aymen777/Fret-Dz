// ─────────────────────────────────────────────
//  Fret-DZ  |  Landing / Home Page  (enhanced)
// ─────────────────────────────────────────────
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    redirect(profile?.role === "transporter" ? "/transporter" : "/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      {/* ── Background decoration ── */}
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-40" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl animate-float-delayed" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-navbar border-b border-[var(--border)] glass">
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
            <Link href="/login" className="btn-ghost btn-sm">Connexion</Link>
            <Link href="/register" className="btn-primary btn-sm">Commencer gratuitement</Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="page-container section relative pt-24 pb-32 text-center">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-secondary" />
            Plateforme B2B de fret — Dzayer
          </div>

          <h1 className="mb-6 text-5xl font-black leading-tight text-[var(--fg)] md:text-6xl">
            Expédiez vos marchandises{" "}
            <span className="text-gradient-primary">partout en Dzayer</span>
          </h1>

          <p className="mx-auto mb-4 max-w-xl text-lg text-[var(--fg-muted)]">
            Fret-DZ connecte les entreprises algériennes avec des transporteurs
            certifiés pour une livraison rapide et fiable dans les{" "}
            <strong className="text-[var(--fg)]">69 wilayas</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
            <Link href="/register" className="btn-primary btn-lg">
              Créer un compte gratuit
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/login" className="btn-outline btn-lg">Connexion</Link>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="mx-auto mt-0 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 stagger-children">
          {[
            { label: "Transporteurs actifs", value: "500+" },
            { label: "Wilayas couvertes", value: "69/69" },
            { label: "Expéditions livrées", value: "12 000+" },
          ].map((stat) => (
            <div key={stat.label} className="card card-body text-center">
              <p className="font-display text-3xl font-black text-gradient-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-container section">
          <div className="text-center mb-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
              Pourquoi Fret-DZ ?
            </div>
            <h2 className="font-display text-4xl font-black text-[var(--fg)]">
              La logistique simplifiée,{" "}
              <span className="text-gradient-primary">de A à Z</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {features.map((f) => (
              <div key={f.title} className="card-hover card-body p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: f.iconBg }}>
                  <f.Icon className="h-5 w-5" style={{ color: f.iconColor }} />
                </div>
                <h3 className="font-display text-base font-bold text-[var(--fg)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="page-container section">
        <div className="text-center mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm text-primary-300">
            Comment ça marche ?
          </div>
          <h2 className="font-display text-4xl font-black text-[var(--fg)]">
            3 étapes pour expédier{" "}
            <span className="text-gradient-primary">sans effort</span>
          </h2>
        </div>

        <div className="mx-auto max-w-3xl grid grid-cols-1 gap-8 sm:grid-cols-3 stagger-children">
          {steps.map((s, i) => (
            <div key={s.title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-800 to-cyan-500 text-white font-black text-lg shadow-glow">
                {i + 1}
              </div>
              <h3 className="font-display font-bold text-[var(--fg)] mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="border-t border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="page-container py-20 text-center max-w-2xl mx-auto">
          <p className="text-4xl text-secondary mb-5">&ldquo;</p>
          <p className="text-xl font-medium text-[var(--fg)] leading-relaxed mb-6">
            &ldquo;Fret-DZ nous a fait économiser des heures chaque semaine.
            Trouver un transporteur fiable pour Tamanrasset relevait d&rsquo;un vrai parcours du combattant avant.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-800 to-cyan-500 text-white font-bold text-sm">
              KA
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm text-[var(--fg)]">Kamel Arabi</p>
              <p className="text-xs text-[var(--fg-muted)]">Directeur logistique — GrosBâti SARL, Alger</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dual CTA ── */}
      <section className="page-container section">
        <div className="mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-children">
          <div className="rounded-2xl p-9 text-white" style={{ background: "linear-gradient(135deg,#1e3a8a,#1a56db)" }}>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <BoxIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display text-2xl font-black mb-2">Je suis expéditeur</h3>
            <p className="text-sm opacity-85 leading-relaxed mb-6">
              Publiez vos offres de fret et trouvez le transporteur idéal en quelques clics.
            </p>
            <Link href="/register?role=shipper"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-blue-900 hover:bg-blue-50 transition-colors">
              Créer un compte expéditeur
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          <div className="rounded-2xl p-9 text-white" style={{ background: "linear-gradient(135deg,#0c4a6e,#06b6d4)" }}>
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <TruckIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display text-2xl font-black mb-2">Je suis transporteur</h3>
            <p className="text-sm opacity-85 leading-relaxed mb-6">
              Accédez à des dizaines de frets chaque jour et développez votre activité.
            </p>
            <Link href="/register?role=transporter"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-cyan-900 hover:bg-cyan-50 transition-colors">
              Rejoindre comme transporteur
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="page-container flex flex-wrap items-center justify-between gap-4 py-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-500">
              <span className="text-xs font-black text-white">F</span>
            </div>
            <span className="font-display text-base font-bold text-[var(--fg)]">
              Fret<span className="text-gradient-primary">-DZ</span>
            </span>
          </div>
          <p className="text-xs text-[var(--fg-muted)]">
            © 2025 Fret-DZ. Tous droits réservés. — Plateforme made in Dzayer
          </p>
          <div className="flex gap-5">
            {["Confidentialité", "CGU", "Contact"].map((t) => (
              <Link key={t} href="#" className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

// ── Data ──────────────────────────────────────

const features = [
  {
    title: "Couverture nationale",
    desc: "Accédez à un réseau de transporteurs dans toutes les 69 wilayas, du Nord au Grand Sud.",
    iconBg: "rgba(30,58,138,0.08)", iconColor: "#1e3a8a",
    Icon: ({ className, style }: any) => (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    title: "Matching instantané",
    desc: "Publiez votre fret et recevez des propositions de transporteurs disponibles en quelques minutes.",
    iconBg: "rgba(6,182,212,0.08)", iconColor: "#06b6d4",
    Icon: ({ className, style }: any) => (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Transporteurs certifiés",
    desc: "Tous nos transporteurs sont vérifiés et notés pour garantir la sécurité de vos marchandises.",
    iconBg: "rgba(245,158,11,0.10)", iconColor: "#d97706",
    Icon: ({ className, style }: any) => (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Suivi en temps réel",
    desc: "Suivez l'avancement de vos expéditions à chaque étape avec notifications automatiques.",
    iconBg: "rgba(6,182,212,0.08)", iconColor: "#06b6d4",
    Icon: ({ className, style }: any) => (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: "Tableau de bord complet",
    desc: "Gérez toutes vos expéditions, factures et partenaires depuis un espace unique et intuitif.",
    iconBg: "rgba(30,58,138,0.08)", iconColor: "#1e3a8a",
    Icon: ({ className, style }: any) => (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Paiement sécurisé",
    desc: "Transactions protégées avec libération des fonds uniquement à la confirmation de livraison.",
    iconBg: "rgba(245,158,11,0.10)", iconColor: "#d97706",
    Icon: ({ className, style }: any) => (
      <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const steps = [
  { title: "Publiez votre fret", desc: "Décrivez votre marchandise, l'itinéraire et la date souhaitée en moins de 2 minutes." },
  { title: "Choisissez un transporteur", desc: "Comparez les offres reçues, les notes et les tarifs, puis acceptez le meilleur match." },
  { title: "Suivez & confirmez", desc: "Suivez la livraison en direct et confirmez la réception pour libérer le paiement." },
];

// Inline icon components used in CTA cards
const BoxIcon = ({ className, style }: any) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const TruckIcon = ({ className, style }: any) => (
  <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);