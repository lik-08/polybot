-- PROPOSED migration only; not deployed. Verify on a new Supabase project before applying.
-- Use Supabase CLI `supabase migration new ...` to create the canonical migration name
-- when initializing the actual project; then transplant this reviewed SQL into it.
create extension if not exists pgcrypto;
create table if not exists public.portfolios (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(name) between 1 and 100),
 base_currency text not null default 'USD' check (base_currency='USD'),
 created_at timestamptz not null default now(),
 unique(id,owner_id)
);
create table if not exists public.portfolio_holdings (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null,
 owner_id uuid not null,
 symbol text not null check (symbol ~ '^[A-Z0-9.^-]{1,20}$'),
 shares numeric(24,10) not null check (shares>=0),
 provenance text not null default 'manual' check (provenance in ('manual','import','broker')),
 updated_at timestamptz not null default now(),
 unique(portfolio_id,symbol),
 foreign key(portfolio_id,owner_id) references public.portfolios(id,owner_id) on delete cascade
);
create table if not exists public.portfolio_cash_events (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null,
 owner_id uuid not null,
 type text not null check (type in ('deposit','withdrawal','purchase','sale','dividend','fee','interest','tax_withholding')),
 amount numeric(24,8) not null check (amount>=0),
 occurred_at timestamptz not null,
 external_id text,
 note text,
 created_at timestamptz not null default now(),
 foreign key(portfolio_id,owner_id) references public.portfolios(id,owner_id) on delete cascade,
 unique(portfolio_id,external_id)
);
create table if not exists public.portfolio_snapshots (
 id bigint generated always as identity primary key,
 portfolio_id uuid not null,
 owner_id uuid not null,
 recorded_at timestamptz not null,
 total_value numeric(24,8) not null check (total_value>=0),
 cash_value numeric(24,8) not null,
 source text not null check (source in ('manual','market','import')),
 max_quote_age_seconds integer check (max_quote_age_seconds>=0),
 created_at timestamptz not null default now(),
 foreign key(portfolio_id,owner_id) references public.portfolios(id,owner_id) on delete cascade,
 unique(portfolio_id,recorded_at,source)
);
create index if not exists holdings_owner_idx on public.portfolio_holdings(owner_id);
create index if not exists cash_events_owner_time_idx on public.portfolio_cash_events(owner_id,occurred_at);
create index if not exists snapshots_owner_time_idx on public.portfolio_snapshots(owner_id,recorded_at);
alter table public.portfolios enable row level security;
alter table public.portfolio_holdings enable row level security;
alter table public.portfolio_cash_events enable row level security;
alter table public.portfolio_snapshots enable row level security;
-- Each owner may only read/write their own rows. Composite FK prevents cross-owner portfolio references.
-- Policies intentionally do NOT permit public/anonymous reads of financial holdings.
create policy portfolio_select on public.portfolios for select to authenticated using ((select auth.uid())=owner_id);
create policy portfolio_insert on public.portfolios for insert to authenticated with check ((select auth.uid())=owner_id);
create policy portfolio_update on public.portfolios for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy portfolio_delete on public.portfolios for delete to authenticated using ((select auth.uid())=owner_id);
create policy holdings_select on public.portfolio_holdings for select to authenticated using ((select auth.uid())=owner_id);
create policy holdings_insert on public.portfolio_holdings for insert to authenticated with check ((select auth.uid())=owner_id);
create policy holdings_update on public.portfolio_holdings for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy holdings_delete on public.portfolio_holdings for delete to authenticated using ((select auth.uid())=owner_id);
create policy cash_select on public.portfolio_cash_events for select to authenticated using ((select auth.uid())=owner_id);
create policy cash_insert on public.portfolio_cash_events for insert to authenticated with check ((select auth.uid())=owner_id);
create policy cash_update on public.portfolio_cash_events for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy cash_delete on public.portfolio_cash_events for delete to authenticated using ((select auth.uid())=owner_id);
create policy snapshot_select on public.portfolio_snapshots for select to authenticated using ((select auth.uid())=owner_id);
-- Snapshot inserts intentionally restricted to service-side collector; no authenticated INSERT policy.
-- No public GRANT or SECURITY DEFINER function; verify privileges and Data API exposure explicitly.