-- =================================================================
-- T2 Laundry — Supabase (Postgres) schema, RLS policies, RPCs, seed data
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- (For an already-provisioned project, use supabase/migrations/ instead.)
-- =================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------
-- Enum types
-- -----------------------------------------------------------------
create type pickup_type as enum ('pickup', 'drop');
create type order_status as enum (
  'pending', 'picked_up', 'in_facility', 'quality_check', 'out_for_delivery', 'delivered', 'cancelled'
);
create type payment_status as enum ('unpaid', 'paid', 'refunded');
create type member_status as enum ('active', 'expired', 'paused', 'cancelled');

-- -----------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------

create table categories (
  id            uuid primary key default gen_random_uuid(),
  name          varchar(120) not null,
  slug          varchar(120) not null,
  description   text,
  icon          varchar(60),
  image_url     varchar(512),
  display_order int default 0,
  active        boolean default true,
  created_date  timestamptz default now(),
  updated_date  timestamptz default now()
);

create table services (
  id               uuid primary key default gen_random_uuid(),
  name             varchar(120) not null,
  slug             varchar(120) not null,
  description      text,
  icon             varchar(60),
  base_price       numeric(10,2) default 0,
  turnaround_hours int default 48,
  currency         varchar(8) default 'QAR',
  active           boolean default true,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);

create table items (
  id                    uuid primary key default gen_random_uuid(),
  name                  varchar(150) not null,
  category              varchar(120) not null,
  description           text,
  image_url             varchar(512),
  wash_price            numeric(10,2) default 0,
  iron_price            numeric(10,2) default 0,
  wash_iron_price       numeric(10,2) default 0,
  dryclean_price        numeric(10,2) default 0,
  eligible_subscription boolean default true,
  popular               boolean default false,
  active                boolean default true,
  display_order         int default 0,
  created_date          timestamptz default now(),
  updated_date          timestamptz default now()
);

create table subscription_plans (
  id                 uuid primary key default gen_random_uuid(),
  name               varchar(120) not null,
  slug               varchar(120),
  tagline            text,
  price              numeric(10,2) not null,
  currency           varchar(8) default 'QAR',
  period             varchar(20) default 'month',
  pieces_per_booking int,
  bookings_per_month int,
  eligible_items     int,
  features           jsonb,
  is_vip             boolean default false,
  popular            boolean default false,
  active             boolean default true,
  created_date       timestamptz default now(),
  updated_date       timestamptz default now()
);

-- Links a Supabase Auth user to a role. One row per signup (customer or admin).
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'customer' check (role in ('customer', 'admin')),
  full_name    text,
  email        text,
  phone        text,
  created_date timestamptz default now()
);

create table members (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id),
  plan_id          uuid references subscription_plans(id),
  full_name        varchar(150) not null,
  email            varchar(180),
  phone            varchar(40) not null,
  plan_name        varchar(120),
  status           member_status default 'active',
  payment_status   text not null default 'paid' check (payment_status in ('pending', 'paid')),
  start_date       date,
  end_date         date,
  bookings_used    int default 0,
  bookings_allowed int default 4,
  items_used       int default 0,
  items_allowed    int default 20,
  created_date     timestamptz default now(),
  updated_date     timestamptz default now()
);

create table orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id),
  order_code      varchar(20) not null unique,
  customer_name   varchar(150) not null,
  customer_phone  varchar(40) not null,
  customer_email  varchar(180),
  address         text,
  pickup_type     pickup_type default 'pickup',
  pickup_date     date,
  pickup_slot     varchar(40),
  items           jsonb,
  total           numeric(10,2) default 0,
  status          order_status default 'pending',
  payment_status  payment_status default 'unpaid',
  subscription_id uuid,
  currency        varchar(8) default 'QAR',
  notes           text,
  created_date    timestamptz default now(),
  updated_date    timestamptz default now()
);

-- Which catalog entries a plan includes. plan_items drives real usage
-- tracking at checkout; plan_services is descriptive only (checkout prices
-- items by their own wash/iron/dryclean columns, not a services-table row).
create table plan_items (
  plan_id uuid not null references subscription_plans(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  primary key (plan_id, item_id)
);

create table plan_services (
  plan_id uuid not null references subscription_plans(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (plan_id, service_id)
);

-- A customer's saved delivery addresses. Purely owner-scoped (no
-- admin/anonymous path needed), so plain RLS is enough — no RPC required
-- the way members/orders needed one.
create table addresses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text,
  address_text text not null,
  is_default   boolean not null default false,
  created_date timestamptz default now()
);

-- -----------------------------------------------------------------
-- updated_date trigger (Postgres has no ON UPDATE clause like MySQL)
-- -----------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

create trigger trg_categories_updated before update on categories
  for each row execute function set_updated_at();
create trigger trg_services_updated before update on services
  for each row execute function set_updated_at();
create trigger trg_items_updated before update on items
  for each row execute function set_updated_at();
create trigger trg_subscription_plans_updated before update on subscription_plans
  for each row execute function set_updated_at();
create trigger trg_members_updated before update on members
  for each row execute function set_updated_at();
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

-- -----------------------------------------------------------------
-- is_admin() — SECURITY DEFINER so it can read profiles regardless of
-- the caller's own RLS visibility (avoids recursive-policy issues).
-- Every "admin-only" policy below uses this — never auth.role() =
-- 'authenticated', which would just mean "logged in as anyone,"
-- customers included.
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

-- Auto-create a profile row for every new Supabase Auth signup.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- -----------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------
alter table categories enable row level security;
alter table services enable row level security;
alter table items enable row level security;
alter table subscription_plans enable row level security;
alter table profiles enable row level security;
alter table members enable row level security;
alter table orders enable row level security;
alter table plan_items enable row level security;
alter table plan_services enable row level security;
alter table addresses enable row level security;

-- Public storefront: read-only on catalogue tables.
create policy "categories_public_read" on categories for select using (true);
create policy "services_public_read" on services for select using (true);
create policy "items_public_read" on items for select using (true);
create policy "subscription_plans_public_read" on subscription_plans for select using (true);

-- Admin (anyone whose profiles.role = 'admin'): full catalogue management.
create policy "categories_admin_write" on categories for all
  using (is_admin()) with check (is_admin());
create policy "items_admin_write" on items for all
  using (is_admin()) with check (is_admin());
create policy "subscription_plans_admin_write" on subscription_plans for all
  using (is_admin()) with check (is_admin());
create policy "services_admin_write" on services for all
  using (is_admin()) with check (is_admin());

-- Profiles: everyone can read/update their own row; admins can read everyone's.
-- Self-service UPDATE is further restricted at the column level below (grant
-- update (full_name, phone)) so a crafted request can never touch role via
-- this row-level policy alone.
create policy "profiles_own_read" on profiles for select using (id = auth.uid());
create policy "profiles_own_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_read" on profiles for select using (is_admin());
revoke update on profiles from authenticated;
grant update (full_name, phone) on profiles to authenticated;

-- Members and orders contain customer PII — no blanket public table access.
-- Public writes/reads for these go through the SECURITY DEFINER RPCs below,
-- plus each customer can read their own membership/orders directly.
create policy "members_admin_read" on members for select using (is_admin());
create policy "members_admin_delete" on members for delete using (is_admin());
create policy "members_own_read" on members for select using (user_id = auth.uid());

create policy "orders_admin_read" on orders for select using (is_admin());
create policy "orders_admin_update" on orders for update using (is_admin()) with check (is_admin());
create policy "orders_own_read" on orders for select using (user_id = auth.uid());

-- Public read on plan↔catalog links (storefront can show "what's included"),
-- admin-only writes.
create policy "plan_items_public_read" on plan_items for select using (true);
create policy "plan_items_admin_write" on plan_items for all
  using (is_admin()) with check (is_admin());
create policy "plan_services_public_read" on plan_services for select using (true);
create policy "plan_services_admin_write" on plan_services for all
  using (is_admin()) with check (is_admin());

-- Addresses: purely owner-scoped, no admin/anonymous path needed.
create policy "addresses_own_all" on addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------
-- RPCs: the only way the public storefront can write/read members & orders.
-- SECURITY DEFINER bypasses RLS deliberately and narrowly — each function
-- returns/touches exactly one row, never a table scan.
-- -----------------------------------------------------------------

-- Attributes the order to the logged-in caller (if any) and, when that
-- caller has an active+paid membership, counts whichever ordered items are
-- included in that plan against their monthly quota. Items outside the
-- plan are simply billed as-is through the order's own total — never
-- blocked, just not counted toward usage.
create or replace function create_order(
  p_order_code text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_address text,
  p_pickup_type pickup_type,
  p_pickup_date date,
  p_pickup_slot text,
  p_items jsonb,
  p_total numeric,
  p_notes text
) returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  v_member members;
  v_line jsonb;
  v_item_id uuid;
  v_qty int;
  v_plan_item_qty int := 0;
begin
  insert into orders (
    user_id, order_code, customer_name, customer_phone, customer_email, address,
    pickup_type, pickup_date, pickup_slot, items, total, status, payment_status, notes
  ) values (
    auth.uid(), p_order_code, p_customer_name, p_customer_phone, p_customer_email, p_address,
    p_pickup_type, p_pickup_date, p_pickup_slot, p_items, p_total, 'pending', 'unpaid', p_notes
  )
  returning * into v_order;

  if auth.uid() is not null then
    select * into v_member from members
      where user_id = auth.uid() and status = 'active' and payment_status = 'paid'
      order by created_date desc limit 1;

    if found then
      for v_line in select * from jsonb_array_elements(p_items)
      loop
        v_item_id := nullif(v_line->>'item_id', '')::uuid;
        v_qty := coalesce((v_line->>'quantity')::int, 0);
        if v_item_id is not null and exists (
          select 1 from plan_items where plan_id = v_member.plan_id and item_id = v_item_id
        ) then
          v_plan_item_qty := v_plan_item_qty + v_qty;
        end if;
      end loop;

      if v_plan_item_qty > 0 then
        update members
        set bookings_used = bookings_used + 1,
            items_used = items_used + v_plan_item_qty
        where id = v_member.id;
      end if;
    end if;
  end if;

  return v_order;
end;
$$;
grant execute on function create_order to anon, authenticated;

create or replace function track_order(p_order_code text)
returns setof orders
language sql
security definer
set search_path = public
as $$
  select * from orders where order_code = p_order_code;
$$;
grant execute on function track_order to anon, authenticated;

-- Membership signup requires a session (Subscribe Now forces signup/login
-- first), so this is authenticated-only. user_id comes from the caller's own
-- session, never a client-supplied value. Admin-created members (walk-ins
-- added from the admin panel) get user_id = NULL rather than being
-- incorrectly linked to the admin's own account.
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
    coalesce(p_bookings_used, 0), coalesce(p_bookings_allowed, 4), coalesce(p_items_used, 0), coalesce(p_items_allowed, 20), 'paid'
  )
  returning * into v_member;
  return v_member;
end;
$$;
grant execute on function create_member to authenticated;

-- Switches the caller's own membership to a different plan. Resolves the
-- membership via auth.uid(), never a client-supplied id, so it can't target
-- anyone else's row.
create or replace function upgrade_membership(p_plan_id uuid)
returns members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan subscription_plans;
  v_member members;
begin
  select * into v_plan from subscription_plans where id = p_plan_id;
  if not found then
    raise exception 'Plan not found';
  end if;

  update members
  set plan_id = v_plan.id,
      plan_name = v_plan.name,
      bookings_allowed = v_plan.bookings_per_month,
      items_allowed = v_plan.eligible_items,
      status = 'active',
      payment_status = 'paid',
      start_date = current_date,
      end_date = current_date + 30
  where user_id = auth.uid()
  returning * into v_member;

  if not found then
    raise exception 'No membership found to upgrade — subscribe to a plan first.';
  end if;

  return v_member;
end;
$$;
grant execute on function upgrade_membership to authenticated;

-- -----------------------------------------------------------------
-- Seed: Categories
-- -----------------------------------------------------------------
insert into categories (name, slug, description, icon, display_order, active) values
('Traditional Wear','traditional','Thobes, Kurtas, Jalabiyas, Shimagh & Ghutra — specialist care for regional garments.','Shirt',1,true),
('Western Wear','western','Shirts, suits, dresses, trousers and everyday western garments.','Layers',2,true),
('Footwear','footwear','Sneakers, leather shoes, heels and boots — restored and refreshed.','Footprints',3,true),
('Home & Carpet','home','Bedsheets, curtains, blankets, carpets and rugs — deep cleaned.','Home',4,true),
('Specialty Care','specialty','Wedding dresses, couture, leather and delicates — handled with couture-grade care.','Crown',5,true),
('Accessories','accessories','Ties, scarves, belts and small leather goods.','Sparkles',6,true);

-- -----------------------------------------------------------------
-- Seed: Services
-- -----------------------------------------------------------------
insert into services (name, slug, description, icon, base_price, turnaround_hours, currency, active) values
('Wash & Fold','wash-fold','Gentle machine wash, expertly folded. Perfect for everyday wear.','Droplets',12,24,'QAR',true),
('Iron & Press','iron-press','Crisp, crease-free pressing on every garment.','Wind',8,24,'QAR',true),
('Wash & Iron','wash-iron','Wash and press in one — ready to wear.','WashingMachine',15,24,'QAR',true),
('Dry Clean','dry-clean','Solvent care for delicates, suits and stains.','Sparkles',25,48,'QAR',true),
('Footwear Care','footwear','Clean, deodorise and restore your shoes.','Footprints',20,48,'QAR',true),
('Home & Carpet','home-care','Deep clean for linens, curtains, carpets and rugs.','Home',30,72,'QAR',true);

-- -----------------------------------------------------------------
-- Seed: Subscription Plans (4 tiers)
-- -----------------------------------------------------------------
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
-- Seed: Items (sample of the catalogue)
-- -----------------------------------------------------------------
insert into items (name, category, wash_price, iron_price, wash_iron_price, dryclean_price, popular, eligible_subscription, display_order, active) values
('Thobe','Traditional Wear',12,8,18,0,true,true,1,true),
('Kurta','Traditional Wear',10,7,16,0,false,true,2,true),
('Jalabiya','Traditional Wear',12,8,18,25,false,true,3,true),
('Shimagh','Traditional Wear',0,6,0,15,false,true,4,true),
('Ghutra','Traditional Wear',0,5,0,12,false,true,5,true),
('Formal Shirt','Western Wear',10,7,15,18,true,true,6,true),
('Trousers','Western Wear',10,7,15,20,false,true,7,true),
('Suit (2-piece)','Western Wear',0,0,0,55,false,true,8,true),
('Dress','Western Wear',12,8,18,28,false,true,9,true),
('Sneakers','Footwear',0,0,0,35,true,true,10,true),
('Leather Shoes','Footwear',0,0,0,30,false,true,11,true),
('Bedsheet (set)','Home & Carpet',18,0,0,0,false,true,12,true),
('Carpet (per sqm)','Home & Carpet',0,0,0,25,false,true,13,true),
('Wedding Dress','Specialty Care',0,0,0,150,true,false,14,true),
('Leather Jacket','Specialty Care',0,0,0,60,false,true,15,true);

-- -----------------------------------------------------------------
-- Seed: Sample orders (no user_id — these predate customer accounts)
-- -----------------------------------------------------------------
insert into orders (order_code, customer_name, customer_phone, pickup_type, pickup_slot, items, total, status, payment_status, created_date) values
('T2-A1B2C3','Ahmed Al-Rashid','+974 5555 1000','pickup','10:00 - 12:00',
  jsonb_build_array(jsonb_build_object('name','Thobe','category','Traditional Wear','service','Wash & Iron','quantity',3,'price',18)),54,'in_facility','unpaid','2026-08-14 09:30:00'),
('T2-D4E5F6','Layla Hassan','+974 5555 1001','pickup','14:00 - 16:00',
  jsonb_build_array(jsonb_build_object('name','Wedding Dress','category','Specialty Care','service','Dry Clean','quantity',1,'price',150)),150,'quality_check','paid','2026-08-13 11:00:00'),
('T2-G7H8I9','Omar Saif','+974 5555 1002','drop','08:00 - 10:00',
  jsonb_build_array(jsonb_build_object('name','Sneakers','category','Footwear','service','Footwear Care','quantity',1,'price',35)),35,'delivered','paid','2026-08-10 08:15:00');

-- -----------------------------------------------------------------
-- Admin user: create via Supabase dashboard → Authentication → Users →
-- Add user (email + password), then run this once with that email —
-- profiles.role = 'admin' is the entire admin panel's access control.
-- -----------------------------------------------------------------
-- insert into profiles (id, email, role)
-- select id, email, 'admin' from auth.users where email = 'YOUR-ADMIN-EMAIL@example.com'
-- on conflict (id) do update set role = 'admin';

-- END OF SQL SCRIPT
