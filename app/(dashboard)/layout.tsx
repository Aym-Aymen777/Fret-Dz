// ─────────────────────────────────────────────
//  Fret-DZ  |  Dashboard Group Layout
//  Server Component — verifies session & auth,
//  then renders Navbar + page slot.
//  Role-based guards are enforced at the page level.
// ─────────────────────────────────────────────
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <div className="page-container py-8">
        {children}
      </div>
    </div>
  );
}
