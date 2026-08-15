-- =================================================================
-- T2 Laundry — Supabase (Postgres) schema, RLS policies, RPCs, seed data
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.
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

create table members (
  id               uuid primary key default gen_random_uuid(),
  full_name        varchar(150) not null,
  email            varchar(180),
  phone            varchar(40) not null,
  plan_name        varchar(120),
  status           member_status default 'active',
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
-- Row Level Security
-- -----------------------------------------------------------------
alter table categories enable row level security;
alter table services enable row level security;
alter table items enable row level security;
alter table subscription_plans enable row level security;
alter table members enable row level security;
alter table orders enable row level security;

-- Public storefront: read-only on catalogue tables.
create policy "categories_public_read" on categories for select using (true);
create policy "services_public_read" on services for select using (true);
create policy "items_public_read" on items for select using (true);
create policy "subscription_plans_public_read" on subscription_plans for select using (true);

-- Admin (the single Supabase Auth user, once logged in): full catalogue management.
create policy "categories_admin_write" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "items_admin_write" on items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Members and orders contain customer PII — no public table access at all.
-- Public writes/reads for these go through the SECURITY DEFINER RPCs below instead.
create policy "members_admin_read" on members for select using (auth.role() = 'authenticated');
create policy "members_admin_delete" on members for delete using (auth.role() = 'authenticated');

create policy "orders_admin_read" on orders for select using (auth.role() = 'authenticated');
create policy "orders_admin_update" on orders for update using (auth.role() = 'authenticated');

-- -----------------------------------------------------------------
-- RPCs: the only way the public storefront can write/read members & orders.
-- SECURITY DEFINER bypasses RLS deliberately and narrowly — each function
-- returns/touches exactly one row, never a table scan.
-- -----------------------------------------------------------------

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
begin
  insert into orders (
    order_code, customer_name, customer_phone, customer_email, address,
    pickup_type, pickup_date, pickup_slot, items, total, status, payment_status, notes
  ) values (
    p_order_code, p_customer_name, p_customer_phone, p_customer_email, p_address,
    p_pickup_type, p_pickup_date, p_pickup_slot, p_items, p_total, 'pending', 'unpaid', p_notes
  )
  returning * into v_order;
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

create or replace function create_member(
  p_full_name text,
  p_email text,
  p_phone text,
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
begin
  insert into members (
    full_name, email, phone, plan_name, status, start_date, end_date,
    bookings_used, bookings_allowed, items_used, items_allowed
  ) values (
    p_full_name, p_email, p_phone, p_plan_name, coalesce(p_status, 'active'), p_start_date, p_end_date,
    coalesce(p_bookings_used, 0), coalesce(p_bookings_allowed, 4), coalesce(p_items_used, 0), coalesce(p_items_allowed, 20)
  )
  returning * into v_member;
  return v_member;
end;
$$;
grant execute on function create_member to anon, authenticated;

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
-- Seed: Subscription Plans
-- -----------------------------------------------------------------
insert into subscription_plans (name, slug, price, currency, period, pieces_per_booking, bookings_per_month, eligible_items, features, is_vip, popular, active)
values
('T2 VIP','t2-vip',109,'QAR','month',20,4,20,
  jsonb_build_array('Free pickup & delivery','Priority booking','Real-time tracking','Up to 4 service bookings / month','20 eligible items / month','24h priority turnaround'),true,true,true),
('Pay As You Go','pay-as-you-go',0,'QAR','month',0,0,0,
  jsonb_build_array('No commitment','Pay per item','Order anytime','Standard turnaround'),false,false,true);

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
-- Seed: Sample members
-- -----------------------------------------------------------------
insert into members (full_name, email, phone, plan_name, status, start_date, end_date, bookings_used, bookings_allowed, items_used, items_allowed) values
('Ahmed Al-Rashid','ahmed@example.com','+974 5555 1000','T2 VIP','active','2026-08-01','2026-08-31',1,4,5,20),
('Layla Hassan','layla@example.com','+974 5555 1001','T2 VIP','active','2026-07-15','2026-08-14',3,4,16,20),
('Omar Saif','omar@example.com','+974 5555 1002','Pay As You Go','active','2026-08-10',NULL,0,0,0,0);

-- -----------------------------------------------------------------
-- Seed: Sample orders
-- -----------------------------------------------------------------
insert into orders (order_code, customer_name, customer_phone, pickup_type, pickup_slot, items, total, status, payment_status, created_date) values
('T2-A1B2C3','Ahmed Al-Rashid','+974 5555 1000','pickup','10:00 - 12:00',
  jsonb_build_array(jsonb_build_object('name','Thobe','category','Traditional Wear','service','Wash & Iron','quantity',3,'price',18)),54,'in_facility','unpaid','2026-08-14 09:30:00'),
('T2-D4E5F6','Layla Hassan','+974 5555 1001','pickup','14:00 - 16:00',
  jsonb_build_array(jsonb_build_object('name','Wedding Dress','category','Specialty Care','service','Dry Clean','quantity',1,'price',150)),150,'quality_check','paid','2026-08-13 11:00:00'),
('T2-G7H8I9','Omar Saif','+974 5555 1002','drop','08:00 - 10:00',
  jsonb_build_array(jsonb_build_object('name','Sneakers','category','Footwear','service','Footwear Care','quantity',1,'price',35)),35,'delivered','paid','2026-08-10 08:15:00');

-- -----------------------------------------------------------------
-- Admin user: create via Supabase dashboard → Authentication → Users → Add user
-- (email + password). RLS policies above grant full access to any authenticated
-- user, so this one login is the entire admin panel's access control.
-- -----------------------------------------------------------------

-- END OF SQL SCRIPT
