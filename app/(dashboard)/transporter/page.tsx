import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransporterDashboardClient from "./TransporterDashboardClient";

export const metadata: Metadata = { title: "Dashboard - Transporteur" };

/**
 * Returns the transporters row AND the profile row for the given userId.
 * The transporter row may not exist yet if the user just signed up.
 */
async function getTransporterData(userId: string) {
  const supabase = await createClient();

  // Fetch transporter profile (may be null if not yet created)
  const { data: transporter, error: tErr } = await supabase
    .from("transporters")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle(); // maybeSingle() returns null (not error) when 0 rows

  if (tErr) {
    console.error("[transporter/page] Failed to fetch transporter row:", tErr.message);
  }

  // Fetch profiles row for the full_name fallback
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();

  if (pErr) {
    console.error("[transporter/page] Failed to fetch profile row:", pErr.message);
  }

  return { transporter, profile };
}

export default async function TransporterDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guard: unauthenticated users should never reach here (layout redirects),
  // but add an explicit check just in case.
  if (!user) redirect("/login");

  // Guard: only transporters can access this page
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "transporter") {
    redirect("/dashboard");
  }

  const { transporter, profile: _profile } = await getTransporterData(user.id);

  // Determine the best display name to greet the user:
  // 1. transporter.company_name  (preferred for transporters)
  // 2. profile.full_name         (fallback — always set at sign-up)
  // 3. profile.email             (last resort)
  const displayName =
    transporter?.company_name ||
    profile?.full_name ||
    profile?.email ||
    "Transporteur";

  return (
    <section className="animate-fade-in space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="font-display text-3xl font-black text-[var(--fg)]">
          Bonjour, {displayName} 👋
        </h1>
        <p className="mt-1 text-[var(--fg-muted)]">
          Bienvenue dans votre tableau de bord
        </p>
      </div>

      <TransporterDashboardClient transporter={transporter} />
    </section>
  );
}
