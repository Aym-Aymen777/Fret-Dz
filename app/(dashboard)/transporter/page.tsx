import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransporterDashboardClient from "./TransporterDashboardClient";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard - Transporteur" };

async function getTransporterProfile(userId: string) {
  const supabase = await createClient();
  // B10 — select only transporter columns; the profile join was unused
  const { data } = await supabase
    .from("transporters")
    .select("*")
    .eq("profile_id", userId)
    .single();
  return data;
}

export default async function TransporterDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // BUG-9 FIX: guard against non-transporters visiting this page
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "transporter") {
      redirect("/dashboard");
    }
  }

  const transporter = user ? await getTransporterProfile(user.id) : null;
  const companyName = transporter?.company_name ?? "Transporteur";

  return (
    <section className="animate-fade-in space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="font-display text-3xl font-black text-[var(--fg)]">
          Bonjour, {companyName} 👋
        </h1>
        <p className="mt-1 text-[var(--fg-muted)]">
          Bienvenue dans votre tableau de bord
        </p>
      </div>

      <TransporterDashboardClient transporter={transporter} />

    </section>
  );
}
