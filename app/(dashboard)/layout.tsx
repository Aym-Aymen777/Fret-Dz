// ─────────────────────────────────────────────
//  Fret-DZ  |  Dashboard Group Layout
//  Server Component — verifies session, fetches profile,
//  then passes both to Navbar so it renders correctly
//  on the first paint with no client-side loading race.
// ─────────────────────────────────────────────
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar initialUser={user} initialProfile={profile as Profile | null} />
      <div className="page-container py-8">
        {children}
      </div>
    </div>
  );
}
