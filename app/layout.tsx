// ─────────────────────────────────────────────
//  Fret-DZ  |  Root Layout
// ─────────────────────────────────────────────
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Fret-DZ — B2B Logistics Platform",
    template: "%s | Fret-DZ",
  },
  description:
    "Fret-DZ connects Algerian businesses with certified transporters for fast, reliable freight delivery across all 58 wilayas.",
  keywords: [
    "logistics",
    "freight",
    "Algeria",
    "transport",
    "B2B",
    "livraison",
  ],
  authors: [{ name: "Fret-DZ Team" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_DZ",
    title: "Fret-DZ — B2B Logistics Platform",
    description: "Freight logistics made simple across Algeria.",
    siteName: "Fret-DZ",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

import { ToastProvider } from "@/components/ToastProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
            try {
              var theme = window.localStorage.getItem('fretdz-theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'dark' || (!theme && prefersDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (err) {
              // Ignore for SSR-safe fallback
            }
          })();`}
        </Script>

        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
