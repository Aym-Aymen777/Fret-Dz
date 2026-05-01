"use client";
// ─────────────────────────────────────────────
//  Fret-DZ  |  useUserProfile hook
//  Returns the current user's profile including role.
//
//  Pass initialUser + initialProfile from a server component to skip
//  the loading state entirely on first render (no client-side race).
//  onAuthStateChange then keeps state in sync for sign-in/out/refresh.
// ─────────────────────────────────────────────
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

interface UseUserProfileReturn {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

interface UseUserProfileOptions {
  initialUser?: User | null;
  initialProfile?: Profile | null;
}

export function useUserProfile(options: UseUserProfileOptions = {}): UseUserProfileReturn {
  const { initialUser = null, initialProfile = null } = options;
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  // When server provides initial data, skip loading entirely.
  // When used without initial data, loading stays true until INITIAL_SESSION.
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (profileError) throw profileError;
          setProfile(profileData as Profile);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to fetch profile");
        }
      }

      // Only resolve the loading gate when INITIAL_SESSION has fired.
      // This branch is only reached when no initialUser was provided.
      if (event === "INITIAL_SESSION") {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    error,
  };
}
