"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  Navbar Component
//  Client Component — reads session, dark toggle, role-based nav
//
//  BUG-16 FIX: removed duplicate useSession call. useUserProfile already
//  exposes user + loading + signOut, so we only need one hook here.
// ─────────────────────────────────────────────
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserRole, Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface NavLink {
  href: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

const CLIENT_NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", roles: ["client"] },
  {
    href: "/transporters",
    label: "Transporteurs",
    icon: "truck",
    roles: ["client"],
  },
  {
    href: "/create-shipment",
    label: "Nouvelle expédition",
    icon: "plus",
    roles: ["client"],
  },
];

const TRANSPORTER_NAV_LINKS: NavLink[] = [
  {
    href: "/transporter",
    label: "Gestion des expéditions",
    icon: "grid",
    roles: ["transporter"],
  },
];

const NAV_LINKS: NavLink[] = [...CLIENT_NAV_LINKS, ...TRANSPORTER_NAV_LINKS];

const ICONS: Record<string, React.ReactNode> = {
  grid: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  truck: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1.5 1M13 16H9m4 0h5.5M13 6h4l3 5v5h-2"
      />
    </svg>
  ),
  plus: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  ),
  sun: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  ),
  moon: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  ),
  logout: (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
};

interface NavbarProps {
  initialUser?: User | null;
  initialProfile?: Profile | null;
}

export default function Navbar({ initialUser = null, initialProfile = null }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, profile } = useUserProfile({ initialUser, initialProfile });
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const saved = localStorage.getItem("fretdz-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return saved ? saved === "dark" : prefersDark;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get nav links for current role — empty array while loading to avoid flicker
  const visibleLinks = !loading
    ? NAV_LINKS.filter((link) => !link.roles || (role !== null && link.roles.includes(role)))
    : [];

  // Home link depends on role
  const homeHref = role === "transporter" ? "/transporter" : "/dashboard";

  // Sync dark mode with document class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("fretdz-theme", next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    // Full reload so the server re-reads the cleared session cookie.
    // router.push() would do a client-side navigation and may serve a
    // cached server component that still shows the authenticated layout.
    window.location.href = "/login";
  };

  const initials = profile?.full_name
    ? profile.full_name.substring(0, 2).toUpperCase()
    : user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <header className="sticky top-0 z-navbar border-b border-[var(--border)] glass">
        <nav className="page-container flex h-16 items-center justify-between gap-4">
          {/* ── Logo — href adapts to role ── */}
          <Link href={homeHref} className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-glow">
              <span className="text-sm font-black text-white">F</span>
            </div>
            <span className="font-display text-xl font-bold text-[var(--fg)]">
              Fret<span className="text-gradient-primary">-DZ</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150
                    ${
                      isActive
                        ? "bg-primary-500/10 text-primary-500 dark:text-primary-300"
                        : "text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                    }`}>
                  {ICONS[link.icon]}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              id="dark-mode-toggle"
              onClick={toggleDark}
              className="btn-icon btn text-[var(--fg-muted)] hover:text-[var(--fg)]"
              aria-label="Toggle dark mode">
              {dark ? ICONS.sun : ICONS.moon}
            </button>

            {/* User avatar / signout */}
            {/* User avatar / signout */}
{!loading && user && (
  <div className="flex items-center gap-2">
    <Link
      href="/profile"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent text-xs font-bold text-white shrink-0 overflow-hidden ring-2 ring-transparent hover:ring-primary-500 transition-all"
      title="Mon profil"
    >
      {profile?.avatar_url ? (
        <img
          src={`${profile.avatar_url}?t=${profile.updated_at}`}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </Link>
    <button
      id="signout-btn"
      onClick={handleSignOut}
      className="btn-ghost btn-sm hidden sm:flex items-center gap-1.5 text-[var(--fg-muted)]">
      {ICONS.logout}
      Déconnexion
    </button>
  </div>
)}

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-toggle"
              className="btn-icon btn md:hidden text-[var(--fg-muted)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] animate-fade-in">
            <div className="page-container py-3 space-y-1">
              {visibleLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "bg-primary-500/10 text-primary-500"
                          : "text-[var(--fg-muted)] hover:bg-[var(--bg)] hover:text-[var(--fg)]"
                      }`}>
                    {ICONS[link.icon]}
                    {link.label}
                  </Link>
                );
              })}
              {user && (
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition-colors">
                  {ICONS.logout}
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
