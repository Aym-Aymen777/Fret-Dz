"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Register Page
//
//  Flow for clients     : Step 1 (role) → Step 2 (account details) → done
//  Flow for transporters: Step 1 (role) → Step 2 (account details)
//                         → Step 3 (transporter profile) → done
//
//  After signUp the user is signed-in automatically (email-confirm disabled)
//  or we sign them in explicitly so we can immediately insert the
//  transporters row with their profile_id = auth.uid().
// ─────────────────────────────────────────────
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole, VehicleType } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES: { value: UserRole; label: string; description: string; icon: string }[] = [
  { value: "client",      label: "Expéditeur",  description: "Je veux envoyer des marchandises", icon: "📦" },
  { value: "transporter", label: "Transporteur", description: "Je veux livrer des marchandises",  icon: "🚛" },
];

const VEHICLE_OPTIONS: { value: VehicleType; label: string; icon: string }[] = [
  { value: "van",        label: "Fourgon",        icon: "🚐" },
  { value: "truck",      label: "Camion",          icon: "🚛" },
  { value: "semi",       label: "Semi-remorque",   icon: "🚚" },
  { value: "pickup",     label: "Pickup",          icon: "🛻" },
  { value: "motorcycle", label: "Moto",            icon: "🏍️" },
];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
  "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
  "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
  "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
  "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arreridj",
  "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal",
  "Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Menia",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router  = useRouter();
  const supabase = createClient();

  // ── Wizard state ──────────────────────────────────────────────────────────
  type Step = 1 | 2 | 3;
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [role, setRole] = useState<UserRole>("client");

  // Step 2 — account credentials
  const [fullName, setFullName] = useState("");
  const [phone,    setPhone]    = useState("");
  const [company,  setCompany]  = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Step 3 — transporter-only profile fields
  const [vehicleType,  setVehicleType]  = useState<VehicleType>("truck");
  const [capacityKg,   setCapacityKg]   = useState("");
  const [pricePerKm,   setPricePerKm]   = useState("");
  const [wilaya,       setWilaya]       = useState("");
  const [description,  setDescription]  = useState("");

  // UI state
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);

  // ── Step 2 → 3 validation ──────────────────────────────────────────────────
  const goToStep3 = (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("Nom complet requis."); return; }
    if (!email.trim())    { setError("Email requis.");        return; }
    if (password.length < 8) { setError("Mot de passe : 8 caractères minimum."); return; }
    if (role === "transporter" && !company.trim()) {
      setError("Nom de l'entreprise requis."); return;
    }
    setError(null);
    setStep(3);
  };

  // ── Final submission (step 2 for clients, step 3 for transporters) ─────────
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Transporter-specific validation
    if (role === "transporter") {
      if (!wilaya)                              { setError("Wilaya requise.");              return; }
      if (!capacityKg || Number(capacityKg) <= 0) { setError("Capacité invalide.");         return; }
      if (!pricePerKm || Number(pricePerKm) <= 0) { setError("Tarif / km invalide.");       return; }
      if (!phone.trim())                        { setError("Téléphone requis.");            return; }
    }

    setLoading(true);

    // ── 1. Create the auth user (also triggers handle_new_user → profiles row) ──
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name:    fullName.trim(),
          company_name: company.trim() || null,
          phone:        phone.trim()   || null,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // ── 2. For transporters: insert the transporters row ──────────────────────
    if (role === "transporter") {
      // The user may need to verify email before they get a session.
      // Try to use the session from signUp; if not available, sign in explicitly.
      let userId = signUpData.user?.id;

      if (!userId) {
        // Email confirmation is ON — sign them in to get session
        const { data: sessionData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr || !sessionData.user) {
          // Can't insert transporters row now — show success anyway;
          // the user must complete their profile after email confirmation.
          setSuccess(true);
          setLoading(false);
          return;
        }
        userId = sessionData.user.id;
      }

      const { error: insertError } = await supabase.from("transporters").insert({
        profile_id:   userId,
        company_name: company.trim() || fullName.trim(),
        description:  description.trim() || null,
        vehicle_type: vehicleType,
        capacity_kg:  Number(capacityKg),
        price_per_km: Number(pricePerKm),
        wilaya,
        phone:        phone.trim(),
        is_available: true,
        rating:       0,
        rating_count: 0,
      });

      if (insertError) {
        // Auth account created but transporters row failed.
        // Show a specific error so the user knows to contact support.
        setError(
          `Compte créé mais profil transporteur non enregistré : ${insertError.message}. ` +
          `Connectez-vous et complétez votre profil depuis le tableau de bord.`
        );
        setLoading(false);
        return;
      }

      // Redirect transporter straight to their dashboard
      router.push("/transporter");
      return;
    }

    // ── 3. Client: show success screen ────────────────────────────────────────
    setSuccess(true);
    setLoading(false);
  };

  // ── Total steps: 2 for clients, 3 for transporters ─────────────────────────
  const totalSteps = role === "transporter" ? 3 : 2;

  // ── Success screen ────────────────────────────────────────────────────────
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
      {/* Background blobs */}
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
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all
                  ${step >= s ? "bg-primary-500 text-white" : "bg-[var(--border)] text-[var(--fg-muted)]"}`}>
                  {step > s ? "✓" : s}
                </div>
                <div className={`h-0.5 flex-1 rounded-full transition-all ${s < totalSteps ? (step > s ? "bg-primary-500" : "bg-[var(--border)]") : "hidden"}`} />
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
              <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: Role selection ── */}
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
                onClick={() => { setError(null); setStep(2); }}
                className="btn-primary btn-lg w-full mt-2"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ── Step 2: Account credentials ── */}
          {step === 2 && (
            <form
              id="register-form"
              onSubmit={role === "transporter" ? goToStep3 : handleRegister}
              className="space-y-4 animate-fade-in"
              noValidate
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full-name" className="label">Nom complet *</label>
                  <input id="full-name" type="text" required value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input" placeholder="Ahmed Benali" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">
                    Téléphone {role === "transporter" ? "*" : ""}
                  </label>
                  <input id="phone" type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input" placeholder="+213 ..." />
                </div>
              </div>

              {role === "transporter" && (
                <div>
                  <label htmlFor="company" className="label">Nom de l&apos;entreprise *</label>
                  <input id="company" type="text" value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="input" placeholder="Transport Express DZ" />
                </div>
              )}

              <div>
                <label htmlFor="reg-email" className="label">Email *</label>
                <input id="reg-email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input" placeholder="vous@exemple.com" />
              </div>

              <div>
                <label htmlFor="reg-password" className="label">Mot de passe *</label>
                <input id="reg-password" type="password" required autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input" placeholder="Min. 8 caractères" minLength={8} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setError(null); setStep(1); }} className="btn-outline flex-1">
                  ← Retour
                </button>
                <button type="submit" id="register-submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : role === "transporter" ? "Suivant →" : "Créer mon compte"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Transporter profile (transporter only) ── */}
          {step === 3 && role === "transporter" && (
            <form id="transporter-profile-form" onSubmit={handleRegister} className="space-y-5 animate-fade-in" noValidate>
              <h2 className="font-display text-base font-bold text-[var(--fg)]">🚛 Profil transporteur</h2>

              {/* Vehicle type */}
              <div>
                <p className="label mb-2">Type de véhicule *</p>
                <div className="grid grid-cols-3 gap-2">
                  {VEHICLE_OPTIONS.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setVehicleType(v.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 text-center text-xs font-medium transition-all
                        ${vehicleType === v.value
                          ? "border-primary-500 bg-primary-500/10 text-primary-500"
                          : "border-[var(--border)] text-[var(--fg-muted)] hover:border-primary-500/40"
                        }`}
                    >
                      <span className="text-2xl">{v.icon}</span>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="capacity" className="label">Capacité (kg) *</label>
                  <input id="capacity" type="number" min="1" step="1"
                    value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)}
                    className="input" placeholder="Ex: 3500" />
                </div>
                <div>
                  <label htmlFor="price-km" className="label">Tarif / km (DZD) *</label>
                  <input id="price-km" type="number" min="1" step="1"
                    value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)}
                    className="input" placeholder="Ex: 45" />
                </div>
              </div>

              {/* Wilaya */}
              <div>
                <label htmlFor="wilaya" className="label">Wilaya de base *</label>
                <select id="wilaya" value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input">
                  <option value="">Sélectionnez une wilaya…</option>
                  {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="t-description" className="label">Description (optionnel)</label>
                <textarea id="t-description" rows={2} value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input resize-none"
                  placeholder="Spécialités, zones couvertes, conditions…" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setError(null); setStep(2); }} className="btn-outline flex-1">
                  ← Retour
                </button>
                <button type="submit" id="transporter-submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : "✅ Créer mon compte"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-[var(--fg-muted)]">
            Déjà inscrit?{" "}
            <Link href="/login" className="font-semibold text-primary-500 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
