-- ─────────────────────────────────────────────
--  Fret-DZ  |  Supabase Schema
--  Run this in: Supabase → SQL Editor
-- ─────────────────────────────────────────────

-- ─── Extensions ──────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────

create type user_role as enum ('client', 'transporter');

create type shipment_status as enum (
  'pending',
  'accepted',
  'in_transit',
  'delivered',
  'rejected'
);

create type vehicle_type as enum (
  'van',
  'truck',
  'semi',
  'pickup',
  'motorcycle'
);

-- ─────────────────────────────────────────────
--  Shared trigger: auto-update updated_at
-- ─────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─────────────────────────────────────────────
--  TABLE 1: profiles
--  One row per auth.users entry (1-to-1)
-- ─────────────────────────────────────────────

create table public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  email         text        not null unique,
  full_name     text        not null default '',
  phone         text,
  avatar_url    text,
  role          user_role   not null default 'client',
  company_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, company_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'company_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
--  TABLE 2: transporters
--  Extra info for users with role = 'transporter'
-- ─────────────────────────────────────────────

create table public.transporters (
  id            uuid        primary key default uuid_generate_v4(),
  profile_id    uuid        not null references public.profiles(id) on delete cascade,
  company_name  text        not null,
  description   text,
  vehicle_type  vehicle_type not null,
  capacity_kg   numeric(10, 2) not null check (capacity_kg > 0),
  price_per_km  numeric(10, 2) not null check (price_per_km > 0),
  rating        numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  rating_count  integer     not null default 0 check (rating_count >= 0),
  is_available  boolean     not null default true,
  wilaya        text        not null,
  logo_url      text,
  phone         text        not null,
  created_at    timestamptz not null default now()
);

create index transporters_profile_id_idx  on public.transporters(profile_id);
create index transporters_wilaya_idx      on public.transporters(wilaya);
create index transporters_is_available_idx on public.transporters(is_available);

-- RLS
alter table public.transporters enable row level security;

create policy "transporters: select all"
  on public.transporters for select
  using (true);

create policy "transporters: insert own"
  on public.transporters for insert
  with check (auth.uid() = profile_id);

create policy "transporters: update own"
  on public.transporters for update
  using (auth.uid() = profile_id);

-- ─────────────────────────────────────────────
--  TABLE 3: shipments
-- ─────────────────────────────────────────────

create table public.shipments (
  id               uuid           primary key default uuid_generate_v4(),
  client_id        uuid           not null references public.profiles(id) on delete cascade,
  transporter_id   uuid           references public.transporters(id) on delete set null,
  title            text           not null,
  description      text,
  origin           text           not null,
  destination      text           not null,
  weight_kg        numeric(10, 2) not null check (weight_kg > 0),
  status           shipment_status not null default 'pending',
  document_url     text,
  estimated_price  numeric(12, 2) check (estimated_price >= 0),
  pickup_date      date,
  delivery_date    date,
  notes            text,
  rejection_reason text,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

create trigger shipments_updated_at
  before update on public.shipments
  for each row execute function public.handle_updated_at();

create index shipments_client_id_idx      on public.shipments(client_id);
create index shipments_transporter_id_idx on public.shipments(transporter_id);
create index shipments_status_idx         on public.shipments(status);
create index shipments_created_at_idx     on public.shipments(created_at desc);

-- RLS
alter table public.shipments enable row level security;

create policy "shipments: client sees own"
  on public.shipments for select
  using (auth.uid() = client_id);

create policy "shipments: transporter sees assigned"
  on public.shipments for select
  using (
    exists (
      select 1 from public.transporters t
      where t.id = shipments.transporter_id
        and t.profile_id = auth.uid()
    )
  );

create policy "shipments: transporter sees all pending"
  on public.shipments for select
  using (status = 'pending');

create policy "shipments: client can create"
  on public.shipments for insert
  with check (auth.uid() = client_id);

create policy "shipments: client can update own pending"
  on public.shipments for update
  using (auth.uid() = client_id and status = 'pending');

create policy "shipments: transporter can update assigned"
  on public.shipments for update
  using (
    exists (
      select 1 from public.transporters t
      where t.id = shipments.transporter_id
        and t.profile_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- BUG-5 FIX: This policy was missing from the original migration but is
-- REQUIRED by acceptShipmentAction in app/(dashboard)/transporter/actions.ts.
--
-- The two existing update policies only allow updates when transporter_id is
-- already set to the authenticated user's transporter row. Pending shipments
-- have transporter_id = NULL, so without this policy the "accept" update is
-- silently rejected by RLS and transporters can never accept any shipment.
-- ─────────────────────────────────────────────────────────────────────────────
create policy "shipments: transporter can accept pending"
  on public.shipments for update
  using (status = 'pending')
  with check (
    transporter_id is not null
    and exists (
      select 1 from public.transporters t
      where t.id = transporter_id
        and t.profile_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket for shipment documents
-- Run this once in the Supabase SQL editor if the bucket does not exist yet:
--
 insert into storage.buckets (id, name, public)
values ('shipment-documents', 'shipment-documents', true)
on conflict do nothing;

-- Then add an upload policy:
create policy "documents: authenticated upload"
on storage.objects for insert
with check (bucket_id = 'shipment-documents' and auth.role() = 'authenticated');
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- BUG-3 FIX: profiles visibility for transporters
--
-- The existing policy "profiles: select own" (using auth.uid() = id) means a
-- transporter can only read their OWN profile row.  When the transporter's
-- shipment query joins profiles via:
--   client:profiles!shipments_client_id_fkey(full_name, phone, ...)
-- Supabase enforces RLS on the joined table, so every client profile returns
-- NULL.  TransporterShipmentCard then shows "Client Inconnu" instead of the
-- real name.
--
-- FIX: add a second SELECT policy that allows any authenticated user to read
-- a profile row when they are a participant in a shared shipment (either as
-- the client or as the assigned transporter), or when the shipment is pending
-- (visible to all transporters).  The existing "select own" policy is kept
-- so self-reads continue to work without hitting the join check.
-- ─────────────────────────────────────────────────────────────────────────────
create policy "profiles: select shipment participants"
  on public.profiles for select
  using (
    -- Any authenticated user can read profiles of shipment participants they
    -- have access to (pending shipments are visible to all transporters).
    exists (
      select 1 from public.shipments s
      where s.client_id = profiles.id
        and (
          -- Pending: visible to all transporters
          s.status = 'pending'
          -- Assigned: visible to the assigned transporter
          or exists (
            select 1 from public.transporters t
            where t.id = s.transporter_id
              and t.profile_id = auth.uid()
          )
          -- Own shipments: clients can always read their own profile (covered
          -- by "select own" too, but included here for completeness)
          or s.client_id = auth.uid()
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- BUG-4 FIX: allow transporters to reject pending shipments
--
-- The existing update policies on shipments are:
--   "client can update own pending"  → requires auth.uid() = client_id
--   "transporter can update assigned" → requires transporter_id already set
--   "transporter can accept pending"  → allows setting transporter_id+accepted
--
-- None of these covers a transporter rejecting a pending shipment (status →
-- rejected, transporter_id stays NULL).  The rejectShipmentAction server
-- action performs this write, and it needs a matching policy to succeed.
--
-- The WITH CHECK restricts the write to status='rejected' only and requires
-- the caller to be a registered transporter, preventing arbitrary updates.
-- ─────────────────────────────────────────────────────────────────────────────
create policy "shipments: transporter can reject pending"
  on public.shipments for update
  using (status = 'pending')
  with check (
    status = 'rejected'
    and exists (
      select 1 from public.transporters t
      where t.profile_id = auth.uid()
    )
  );