// ─────────────────────────────────────────────
//  Fret-DZ  |  Supabase Server Client
//  Use this in Server Components, Route Handlers
//  and Server Actions. Reads/writes cookies so
//  the session is forwarded automatically.
// ─────────────────────────────────────────────
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Middleware refreshes the session cookie instead.
          }
        },
      },
    }
  );
}
