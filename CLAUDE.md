# Fret-DZ — Claude Code Guide

## Project Overview

**Fret-DZ** is a B2B freight logistics platform connecting Algerian businesses with certified transporters across all 58 wilayas. Built with Next.js 16 App Router, Supabase, TypeScript, and Tailwind CSS v4.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS v4 |
| Package manager | npm |

## Project Structure

```
app/
  (auth)/
    login/          # Login page
    register/       # Registration page
  (dashboard)/
    dashboard/      # Main dashboard
    create-shipment/ # Shipment creation form
    transporters/   # Transporter listing/search
    layout.tsx      # Dashboard shell layout
  layout.tsx        # Root layout (metadata, fonts)
  page.tsx          # Landing / hero page
components/
  Navbar.tsx
  ShipmentCard.tsx
  StatusBadge.tsx
  TransporterCard.tsx
  UploadField.tsx
hooks/
  useSession.ts     # Auth session hook (client)
  useShipments.ts   # Shipments CRUD + realtime hook
lib/
  supabase/
    client.ts       # Browser client (Client Components)
    server.ts       # Server client (Server Components / Route Handlers)
  types.ts          # All shared TypeScript types
```

## Key Architecture Rules

- **Server vs Client Supabase clients**: Always use `lib/supabase/server.ts` in Server Components and Route Handlers. Use `lib/supabase/client.ts` only in Client Components (`"use client"`).
- **Route groups**: `(auth)` routes are public. `(dashboard)` routes require an authenticated session — the layout at `app/(dashboard)/layout.tsx` handles the auth guard.
- **Types**: All shared types live in `lib/types.ts`. Do not duplicate type definitions elsewhere.
- **Real-time**: Shipment updates use Supabase Postgres Changes subscriptions inside `useShipments`.

## Domain Model (key types)

- `UserRole`: `"client" | "transporter" | "admin"`
- `ShipmentStatus`: `"pending" | "accepted" | "in_transit" | "delivered" | "rejected"`
- `VehicleType`: `"van" | "truck" | "semi" | "pickup" | "motorcycle"`
- `Transporter.wilaya`: Algerian province (one of 58 wilayas)
- Shipment documents are stored in the `shipment-documents` Supabase Storage bucket, keyed as `{userId}/{timestamp}.{ext}`.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

These must be set in `.env.local` (never committed).

## Common Commands

```bash
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
```

## Conventions

- French UI: all user-facing strings are in French (locale `fr_DZ`).
- CSS uses CSS custom properties (`var(--bg)`, `var(--fg)`, `var(--border)`) defined in `globals.css`.
- Utility class naming follows the project's design system (e.g., `btn-primary`, `btn-ghost`, `card`, `card-body`, `page-container`, `section`).
- Prefer Server Components by default; add `"use client"` only when needed (interactivity, hooks, browser APIs).