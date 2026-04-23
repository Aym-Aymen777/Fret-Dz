"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Register Page
// ─────────────────────────────────────────────
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

const ROLES: { value: UserRole; label: string; description: string; icon: string }[] = [
  { value: "client",      label: "Expéditeur",   description: "Je veux envoyer des marchandises",   icon: "📦" },
  { value: "transporter", label: "Transporteur",  description: "Je veux livrer des marchandises",    icon: "🚛" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]           = useState<1 | 2>(1);
  const [role, setRole]           = useState<UserRole>("client");
  const [fullName, setFullName]   = useState("");
  const [company, setCompany]     = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          company_name: company.trim(),
          phone: phone.trim(),
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
        <div className="card p-8 max-w-md w-full text-center animate-fade-in shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-4xl">
            ✅
          </div>
          <h2 className="font-display text-2xl font-bold text-[var(--fg)]">Compte créé !</h2>
          <p className="mt-2 text-[var(--fg-muted)]">
            Vérifiez votre email <strong>{email}</strong> pour confirmer votre compte.
          </p>
          <Link href="/login" className="btn-primary mt-6 inline-flex">
            Aller à la connexion
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      </div>

      <div className="relative w-full max-w-lg animate-fade-in">
        <div className="card p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 shadow-glow">
              <span className="font-display text-xl font-black text-white">F</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[var(--fg)]">
              Rejoindre Fret<span className="text-gradient-primary">-DZ</span>
            </h1>
          </div>

          {/* Step indicator */}
          <div className="mb-6 flex items-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all
                  ${step >= s ? "bg-primary-500 text-white" : "bg-[var(--border)] text-[var(--fg-muted)]"}`}>
                  {s}
                </div>
                <div className={`h-0.5 flex-1 transition-all rounded-full ${s < 2 ? (step > s ? "bg-primary-500" : "bg-[var(--border)]") : "hidden"}`} />
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm font-medium text-[var(--fg)]">Vous êtes…</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    id={`role-${r.value}`}
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 text-center transition-all duration-150
                      ${role === r.value
                        ? "border-primary-500 bg-primary-500/10 shadow-glow"
                        : "border-[var(--border)] hover:border-primary-500/50 hover:bg-[var(--surface)]"
                      }`}
                  >
                    <span className="text-3xl">{r.icon}</span>
                    <span className="text-sm font-bold text-[var(--fg)]">{r.label}</span>
                    <span className="text-xs text-[var(--fg-muted)] leading-tight">{r.description}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                id="step1-next"
                onClick={() => setStep(2)}
                className="btn-primary btn-lg w-full mt-2"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* Step 2: Account details */}
          {step === 2 && (
            <form id="register-form" onSubmit={handleRegister} className="space-y-4 animate-fade-in" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full-name" className="label">Nom complet</label>
                  <input id="full-name" type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input" placeholder="Ahmed Benali" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Téléphone</label>
                  <input id="phone" type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input" placeholder="+213 ..." />
                </div>
              </div>

              {role === "transporter" && (
                <div>
                  <label htmlFor="company" className="label">Nom de l&apos;entreprise</label>
                  <input id="company" type="text" value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="input" placeholder="Transport Express DZ" />
                </div>
              )}

              <div>
                <label htmlFor="reg-email" className="label">Email</label>
                <input id="reg-email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="vous@exemple.com" />
              </div>

              <div>
                <label htmlFor="reg-password" className="label">Mot de passe</label>
                <input id="reg-password" type="password" required autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="Min. 8 caractères" minLength={8} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                  ← Retour
                </button>
                <button type="submit" id="register-submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : "Créer mon compte"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-[var(--fg-muted)]">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-semibold text-primary-500 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
