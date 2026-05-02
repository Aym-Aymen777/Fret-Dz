// ─────────────────────────────────────────────
//  Fret-DZ  |  Profile Page  (Server Component)
// ─────────────────────────────────────────────
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import type { Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--fg)]">Mon profil</h1>
        <p className="text-sm text-[var(--fg-muted)] mt-1">
          Gérez vos informations personnelles
        </p>
      </div>
      <ProfileForm profile={profile as Profile} />
    </div>
  );
}