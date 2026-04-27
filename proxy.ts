// ─────────────────────────────────────────────
//  Fret-DZ  |  Next.js 16 Route Proxy
//  In Next.js 16 the convention changed from "middleware.ts"
//  to "proxy.ts" with export function named "proxy".
//
//  Refreshes Supabase session on every request and protects routes.
//
//  FIXES applied:
//  BUG-2:  This file IS the middleware (proxy) — correctly named proxy.ts
//  BUG-4:  Role-aware redirect for authenticated users on auth pages
//  BUG-15: /transporter added to PROTECTED_PREFIXES
// ─────────────────────────────────────────────
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
// BUG-15 FIX: /transporter was missing from the original
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transporters",
  "/create-shipment",
  "/transporter",
];
// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ["/login", "/register"];

// Next.js 16 requires the exported function to be named "proxy"
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies back to both the request and the response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT add any logic between createServerClient and
  // getUser() — it breaks session refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected pages
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // BUG-4 FIX: Role-aware redirect for authenticated users on auth pages.
  // Previously always sent to /dashboard — transporters now go to /transporter.
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const destination =
      profile?.role === "transporter" ? "/transporter" : "/dashboard";

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
