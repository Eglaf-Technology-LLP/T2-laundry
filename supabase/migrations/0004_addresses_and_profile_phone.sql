-- =================================================================
-- T2 Laundry — Migration 0004: customer address book + profile phone.
--
-- Idempotent — safe to run on the already-provisioned project. Run
-- this whole file in the Supabase SQL editor.
-- =================================================================

-- -----------------------------------------------------------------
-- 1. profiles.phone — captured/edited from the Account page. Column-
--    level grant widened to include it alongside full_name.
-- -----------------------------------------------------------------
alter table profiles add column if not exists phone text;

revoke update on profiles from authenticated;
grant update (full_name, phone) on profiles to authenticated;

-- -----------------------------------------------------------------
-- 2. addresses — a customer's saved delivery addresses. Purely
--    owner-scoped (no admin/anonymous path needed), so plain RLS is
--    enough; no RPC required the way members/orders needed one.
-- -----------------------------------------------------------------
create table if not exists addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text,
  address_text text not null,
  is_default   boolean not null default false,
  created_date timestamptz default now()
);

alter table addresses enable row level security;

drop policy if exists "addresses_own_all" on addresses;
create policy "addresses_own_all" on addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- END OF MIGRATION
