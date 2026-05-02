"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Profile Form  (Client Component)
//  Handles avatar upload + profile field updates
// ─────────────────────────────────────────────
import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";
import type { Profile } from "@/lib/types";

export default function ProfileForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const initials = profile.full_name
    ? profile.full_name.substring(0, 2).toUpperCase()
    : profile.email.substring(0, 2).toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 2 MB limit
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'image ne doit pas dépasser 2 Mo." });
      return;
    }

    setUploading(true);
    setMessage(null);

    const ext = file.name.split(".").pop();
    const filePath = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage({ type: "error", text: "Échec du téléchargement de l'avatar." });
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    // bust cache so the new image shows immediately
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("avatar_url", avatarUrl);

    const result = await updateProfile(formData);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
    }
    setSaving(false);
  }

  return (
    <div className="card p-6 space-y-6">
      {/* ── Avatar section ── */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold text-white">{initials}</span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-[var(--fg)]">Photo de profil</p>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5 mb-2">
            JPG, PNG ou WebP · Max 2 Mo
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-ghost btn-sm text-primary-500 border border-primary-500/30 hover:bg-primary-500/10 disabled:opacity-50"
          >
            {uploading ? "Téléchargement…" : "Changer la photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="border-t border-[var(--border)]" />

      {/* ── Form fields ── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full name */}
        <div>
          <label className="block text-sm font-medium text-[var(--fg)] mb-1">
            Nom complet <span className="text-danger">*</span>
          </label>
          <input
            name="full_name"
            defaultValue={profile.full_name}
            required
            placeholder="Votre nom complet"
            className="input w-full"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[var(--fg)] mb-1">
            Téléphone
          </label>
          <input
            name="phone"
            defaultValue={profile.phone ?? ""}
            placeholder="+213 6xx xxx xxx"
            className="input w-full"
          />
        </div>

        {/* Company — only shown to transporters */}
        {profile.role === "transporter" && (
          <div>
            <label className="block text-sm font-medium text-[var(--fg)] mb-1">
              Nom de l'entreprise
            </label>
            <input
              name="company_name"
              defaultValue={profile.company_name ?? ""}
              placeholder="Votre entreprise"
              className="input w-full"
            />
          </div>
        )}

        {/* Email — read only */}
        <div>
          <label className="block text-sm font-medium text-[var(--fg)] mb-1">
            Email
          </label>
          <input
            value={profile.email}
            disabled
            className="input w-full opacity-60 cursor-not-allowed bg-[var(--surface)]"
          />
          <p className="text-xs text-[var(--fg-muted)] mt-1">
            L'adresse e-mail ne peut pas être modifiée ici.
          </p>
        </div>

        {/* Role badge */}
        <div>
          <label className="block text-sm font-medium text-[var(--fg)] mb-1">
            Rôle
          </label>
          <span className="badge badge-primary capitalize">{profile.role}</span>
        </div>

        {/* Feedback message */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-danger/10 text-danger border border-danger/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn btn-primary w-full sm:w-auto disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}