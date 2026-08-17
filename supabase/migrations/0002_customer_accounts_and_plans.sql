-- =================================================================
-- T2 Laundry — Migration 0002: customer accounts, role-based admin
-- security, 4-tier membership plans, and admin write access to
-- subscription_plans/services.
--
-- Safe to run on the already-provisioned project (idempotent: uses
-- IF NOT EXISTS / DROP ... IF EXISTS throughout). Run this whole file
-- in the Supabase SQL editor, then run the one-line admin promotion
-- at the very bottom with your real admin email.
-- =================================================================

-- -----------------------------------------------------------------
-- 1. profiles — links auth.users to a role. Every Supabase Auth
--    signup (customer or admin) gets exactly one row here.
-- -----------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'customer' check (role in ('customer', 'admin')),
  full_name    text,
  email        text,
  created_date timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles_own_read" on profiles;
create policy "profiles_own_read" on profiles for select using (id = auth.uid());

drop policy if exists "profiles_own_update" on profiles;
create policy "profiles_own_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- -----------------------------------------------------------------
-- 2. is_admin() — the real admin check. SECURITY DEFINER so it can
--    read profiles regardless of the caller's own RLS visibility
--    (avoids recursive-policy issues), used everywhere below in
--    place of the old, dangerously-broad auth.role() = 'authenticated'.
-- -----------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Admins can read every profile (customer list); is_admin() itself bypasses
-- RLS internally so this doesn't recurse.
drop policy if exists "profiles_admin_read" on profiles;
create policy "profiles_admin_read" on profiles for select using (is_admin());

-- -----------------------------------------------------------------
-- 3. Auto-create a profile row for every new Supabase Auth signup.
-- -----------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------
-- 4. Replace every auth.role() = 'authenticated' policy with is_admin().
--    This is the security fix: previously ANY logged-in user (which
--    will soon include every customer) counted as "admin".
-- -----------------------------------------------------------------
drop policy if exists "categories_admin_write" on categories;
create policy "categories_admin_write" on categories for all
  using (is_admin()) with check (is_admin());

drop policy if exists "items_admin_write" on items;
create policy "items_admin_write" on items for all
  using (is_admin()) with check (is_admin());

drop policy if exists "members_admin_read" on members;
create policy "members_admin_read" on members for select using (is_admin());

drop policy if exists "members_admin_delete" on members;
create policy "members_admin_delete" on members for delete using (is_admin());

drop policy if exists "orders_admin_read" on orders;
create policy "orders_admin_read" on orders for select using (is_admin());

drop policy if exists "orders_admin_update" on orders;
create policy "orders_admin_update" on orders for update using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------
-- 5. subscription_plans / services previously had no write policy at
--    all (no admin UI existed for them yet) — add one, plus the new
--    tagline column subscription_plans needs for the redesigned cards.
-- -----------------------------------------------------------------
alter table subscription_plans add column if not exists tagline text;

drop policy if exists "subscription_plans_admin_write" on subscription_plans;
create policy "subscription_plans_admin_write" on subscription_plans for all
  using (is_admin()) with check (is_admin());

drop policy if exists "services_admin_write" on services;
create policy "services_admin_write" on services for all
  using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------
-- 6. members — link to the signed-up account and the chosen plan,
--    and track whether the membership has actually been paid for
--    (no payment processing is wired up yet, so this starts 'pending'
--    for every new signup until real billing is added later).
-- -----------------------------------------------------------------
alter table members add column if not exists user_id uuid references auth.users(id);
alter table members add column if not exists plan_id uuid references subscription_plans(id);
alter table members add column if not exists payment_status text not null default 'pending' check (payment_status in ('pending', 'paid'));

drop policy if exists "members_own_read" on members;
create policy "members_own_read" on members for select using (user_id = auth.uid());

-- -----------------------------------------------------------------
-- 7. create_member RPC — add plan_id, and set user_id from the
--    caller's own session rather than trusting a client-supplied
--    value. Admin-created members (walk-ins added from the admin
--    panel, not self-signup) get user_id = NULL rather than being
--    incorrectly linked to the admin's own account.
-- -----------------------------------------------------------------
drop function if exists create_member(text, text, text, text, member_status, date, date, int, int, int, int);

create or replace function create_member(
  p_full_name text,
  p_email text,
  p_phone text,
  p_plan_id uuid,
  p_plan_name text,
  p_status member_status,
  p_start_date date,
  p_end_date date,
  p_bookings_used int,
  p_bookings_allowed int,
  p_items_used int,
  p_items_allowed int
) returns members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member members;
  v_user_id uuid;
begin
  v_user_id := case when is_admin() then null else auth.uid() end;

  insert into members (
    user_id, full_name, email, phone, plan_id, plan_name, status, start_date, end_date,
    bookings_used, bookings_allowed, items_used, items_allowed, payment_status
  ) values (
    v_user_id, p_full_name, p_email, p_phone, p_plan_id, p_plan_name, coalesce(p_status, 'active'), p_start_date, p_end_date,
    coalesce(p_bookings_used, 0), coalesce(p_bookings_allowed, 4), coalesce(p_items_used, 0), coalesce(p_items_allowed, 20), 'pending'
  )
  returning * into v_member;
  return v_member;
end;
$$;

-- Signing up requires a session now, so only authenticated callers need this
-- (previously anon too — that path no longer applies now that Subscribe
-- always requires signup/login first).
revoke execute on function create_member from anon;
grant execute on function create_member to authenticated;

-- -----------------------------------------------------------------
-- 8. Reseed subscription_plans: the old 2-tier model (T2 VIP / Pay As
--    You Go) is replaced by 4 real tiers. Safe to delete — plan_id
--    on members was just added above, so no existing row references
--    the old plan ids yet.
-- -----------------------------------------------------------------
delete from subscription_plans;

insert into subscription_plans (name, slug, tagline, price, currency, period, bookings_per_month, eligible_items, features, is_vip, popular, active) values
('Essential', 'essential', 'Perfect for individuals.', 109, 'QAR', 'month', 4, 20,
  jsonb_build_array('Up to 4 Service Bookings per Month', 'Up to 20 Eligible Items per Month', 'Free Pickup & Delivery', 'Reward Points', 'Priority Booking', 'Order Tracking', 'Free Pickup'),
  false, false, true),
('Couple', 'couple', 'Perfect for couples.', 199, 'QAR', 'month', 8, 40,
  jsonb_build_array('Up to 8 Service Bookings per Month', 'Up to 40 Eligible Items per Month', 'Free Pickup & Delivery', 'Priority Booking', 'Reward Points', 'Exclusive Member Discounts', 'Includes everything in Essential PLUS', 'Free Pickup'),
  false, false, true),
('Family', 'family', 'Perfect for families.', 249, 'QAR', 'month', 12, 60,
  jsonb_build_array('Up to 12 Service Bookings per Month', 'Up to 60 Eligible Items per Month', 'Free Pickup & Delivery', 'Priority Support', 'Family Benefits', 'Reward Points', 'Includes everything in Couple PLUS', 'Free Pickup', 'Priority Support'),
  false, false, true),
('VIP', 'vip', 'Premium Membership.', 499, 'QAR', 'month', 20, 120,
  jsonb_build_array('Up to 20 Service Bookings per Month', 'Up to 120 Eligible Items per Month', 'Unlimited Pickup & Delivery', 'Express Priority Service', 'Dedicated Customer Support', 'Highest Reward Points', 'Exclusive VIP Benefits', 'Includes everything in Family PLUS', 'Free Pickup', 'Express', 'Priority', 'Priority Support'),
  true, true, true);

-- -----------------------------------------------------------------
-- 9. RUN THIS LAST, BY HAND, with your real admin email — promotes
--    your existing Supabase Auth admin user (created before this
--    migration existed, so it has no profiles row yet) to role='admin'.
--    Without this, your admin login still works but can no longer
--    reach any /admin data, since is_admin() now gates all of it.
-- -----------------------------------------------------------------
-- insert into profiles (id, email, role)
-- select id, email, 'admin' from auth.users where email = 'YOUR-ADMIN-EMAIL@example.com'
-- on conflict (id) do update set role = 'admin';

-- END OF MIGRATION
