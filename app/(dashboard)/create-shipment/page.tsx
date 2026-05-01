"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Create Shipment Page
//  Client Component — multi-step form with
//  file upload and real-time validation
// ─────────────────────────────────────────────
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import UploadField from "@/components/UploadField";
import { useShipments } from "@/hooks/useShipments";
import type { CreateShipmentInput } from "@/lib/types";

// Algerian wilayas (abbreviated list — extend as needed)
const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra",
  "Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret",
  "Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda",
  "Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem",
  "M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arreridj",
  "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela",
  "Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal",
  "Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair",
  "El Menia",
];
interface FormState {
  title:       string;
  description: string;
  origin:      string;
  destination: string;
  weight_kg:   string;
  pickup_date: string;
  notes:       string;
  document:    File | null;
}

const INITIAL: FormState = {
  title: "", description: "", origin: "", destination: "",
  weight_kg: "", pickup_date: "", notes: "", document: null,
};

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: "Informations",  icon: "📋" },
  { id: 2, label: "Itinéraire",    icon: "🗺️" },
  { id: 3, label: "Documents",     icon: "📎" },
];

export default function CreateShipmentPage() {
  const router = useRouter();
  const { createShipment } = useShipments();

  const [step, setStep]       = useState<Step>(1);
  const [form, setForm]       = useState<FormState>(INITIAL);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [submitting, setSub]  = useState(false); 
  const [apiError, setApiErr] = useState<string | null>(null);

  // Controlled field helper
  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  // Per-step validation
  const validateStep = (s: Step): boolean => {
    const errs: Partial<FormState> = {};
    if (s === 1) {
      if (!form.title.trim())    errs.title    = "Titre requis";
      if (!form.weight_kg || Number(form.weight_kg) <= 0)
                                 errs.weight_kg = "Poids invalide";
    }
    if (s === 2) {
      if (!form.origin.trim())      errs.origin      = "Wilaya de départ requise";
      if (!form.destination.trim()) errs.destination = "Wilaya de destination requise";
      if (form.origin === form.destination && form.origin)
                                    errs.destination = "Départ et arrivée doivent être différents";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (validateStep(step)){
     setSub(false);
      setStep((s) => (Math.min(s + 1, 3) as Step));
    }
    };
  const prev = () => setStep((s) => (Math.max(s - 1, 1) as Step));

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    // Step validations already ran via next() — no need to re-validate step 3
         if(step!==3) return
    setSub(true);
    setApiErr(null);

    const payload: CreateShipmentInput = {
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      origin:      form.origin,
      destination: form.destination,
      weight_kg:   Number(form.weight_kg),
      pickup_date: form.pickup_date || undefined,
      notes:       form.notes.trim() || undefined,
      document:    form.document ?? undefined,
    };

    // FIX: wrap in try/catch so any unhandled exception (network error,
    // Supabase crash, etc.) always resets the submitting flag.
    // Previously an uncaught exception left submitting=true permanently,
    // making the submit button permanently disabled (stuck in loading state).
    try {
      const { error } = await createShipment(payload);
      if (error) {
        setApiErr(error);
        setSub(false);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inattendue";
      setApiErr(msg);
      setSub(false);
    }
  };

  return (
    <section className="animate-fade-in mx-auto max-w-2xl space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="font-display text-3xl font-black text-[var(--fg)]">
          Nouvelle expédition
        </h1>
        <p className="mt-1 text-[var(--fg-muted)]">
          Remplissez les informations pour créer votre expédition.
        </p>
      </div>

      {/* ── Step indicator ── */}
      <div className="flex items-start w-full">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => step > s.id && setStep(s.id as Step)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200
                  ${step === s.id
                    ? "border-primary-500 bg-primary-500 text-white scale-110 shadow-glow"
                    : step > s.id
                    ? "border-primary-500 bg-primary-500/10 text-primary-500 cursor-pointer hover:bg-primary-500/20"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)]"
                  }`}
              >
                {step > s.id ? "✓" : s.icon}
              </button>
              <span className={`hidden sm:block text-xs font-medium text-center transition-colors leading-tight
                ${step === s.id ? "text-primary-500" : "text-[var(--fg-muted)]"}`}>
                {s.label}
              </span>
            </div>

            {/* Connector line between steps only */}
            {i < STEPS.length - 1 && (
              <div className="flex-1 flex items-center pt-5">
                <div className={`h-0.5 w-full rounded-full transition-all duration-300
                  ${step > s.id ? "bg-primary-500" : "bg-[var(--border)]"}`} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Form card ── */}
      <div id="create-shipment-form" onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} noValidate>
        <div className="card p-6 space-y-5">

          {/* ── Step 1: Basic info ── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-display text-lg font-bold text-[var(--fg)]">
                📋 Informations générales
              </h2>

              <div>
                <label htmlFor="title" className="label">Titre de l&apos;expédition *</label>
                <input
                  id="title" type="text" value={form.title} onChange={set("title")}
                  className={`input ${errors.title ? "border-danger focus:border-danger" : ""}`}
                  placeholder="Ex: Colis électroniques Alger → Oran"
                />
                {errors.title && <p className="form-error">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="description" className="label">Description</label>
                <textarea
                  id="description" rows={3} value={form.description}
                  onChange={set("description")}
                  className="input resize-none"
                  placeholder="Décrivez votre marchandise (nature, emballage, fragilité…)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight" className="label">Poids (kg) *</label>
                  <input
                    id="weight" type="number" min="0.1" step="0.1"
                    value={form.weight_kg} onChange={set("weight_kg")}
                    className={`input ${errors.weight_kg ? "border-danger" : ""}`}
                    placeholder="Ex: 250"
                  />
                  {errors.weight_kg && <p className="form-error">{errors.weight_kg}</p>}
                </div>
                <div>
                  <label htmlFor="pickup-date" className="label">Date d&apos;enlèvement</label>
                  <input
                    id="pickup-date" type="date" value={form.pickup_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={set("pickup_date")} className="input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="label">Notes supplémentaires</label>
                <textarea
                  id="notes" rows={2} value={form.notes} onChange={set("notes")}
                  className="input resize-none"
                  placeholder="Instructions spéciales pour le transporteur…"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Route ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-display text-lg font-bold text-[var(--fg)]">
                🗺️ Itinéraire
              </h2>

              <div>
                <label htmlFor="origin" className="label">Wilaya de départ *</label>
                <select
                  id="origin" value={form.origin} onChange={set("origin")}
                  className={`input ${errors.origin ? "border-danger" : ""}`}
                >
                  <option value="">Sélectionnez une wilaya…</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                {errors.origin && <p className="form-error">{errors.origin}</p>}
              </div>

              {/* Visual route arrow */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <div>
                <label htmlFor="destination" className="label">Wilaya de destination *</label>
                <select
                  id="destination" value={form.destination} onChange={set("destination")}
                  className={`input ${errors.destination ? "border-danger" : ""}`}
                >
                  <option value="">Sélectionnez une wilaya…</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                {errors.destination && <p className="form-error">{errors.destination}</p>}
              </div>

              {/* Route preview */}
              {form.origin && form.destination && form.origin !== form.destination && (
                <div className="flex items-center gap-3 rounded-xl border border-primary-500/20 bg-primary-500/5 px-4 py-3 text-sm animate-fade-in">
                  <span className="font-semibold text-primary-500">{form.origin}</span>
                  <svg className="h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold text-primary-500">{form.destination}</span>
                  <span className="ml-auto text-[var(--fg-muted)]">
                    {form.weight_kg && !isNaN(Number(form.weight_kg)) ? `${Number(form.weight_kg).toLocaleString()} kg` : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Document ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="font-display text-lg font-bold text-[var(--fg)]">
                📎 Document de livraison
              </h2>
              <p className="text-sm text-[var(--fg-muted)]">
                Joignez votre bon de commande, facture ou tout document nécessaire (optionnel).
              </p>

              <UploadField
                id="shipment-document"
                label="Document (PDF, image)"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                maxSizeMB={10}
                onChange={(file) => setForm((f) => ({ ...f, document: file }))}
              />

              {/* Summary recap */}
              <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                <div className="px-4 py-2.5 bg-[var(--bg)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                    Récapitulatif
                  </p>
                </div>
                {[
                  { label: "Titre",       value: form.title },
                  { label: "Départ",      value: form.origin },
                  { label: "Arrivée",     value: form.destination },
                  { label: "Poids",       value: form.weight_kg ? `${form.weight_kg} kg` : "—" },
                  { label: "Enlèvement",  value: form.pickup_date || "Non précisé" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-[var(--fg-muted)]">{row.label}</span>
                    <span className="font-medium text-[var(--fg)]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── API error ── */}
          {apiError && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger animate-fade-in">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex gap-3 pt-2 border-t border-[var(--border)]">
            {step > 1 && (
              <button type="button" onClick={prev} className="btn-outline flex-1">
                ← Précédent
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                id={`step${step}-next`}
                onClick={next}
                className="btn-primary flex-1"
              >
                Suivant →
              </button>
            ) : (
              <button
                type="button"
                id="submit-shipment"
                disabled={submitting}
                onClick={() => handleSubmit()}
                className="btn-primary btn-lg flex-1"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Création en cours…
                  </>
                ) : (
                  "✅ Créer l'expédition"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
