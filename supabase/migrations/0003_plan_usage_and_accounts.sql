-- =================================================================
-- T2 Laundry — Migration 0003: plan-usage tracking, plan↔catalog
-- links, customer accounts (orders/upgrade), and a profile-update
-- security fix.
--
-- Idempotent — safe to run on the already-provisioned project. Run
-- this whole file in the Supabase SQL editor.
-- =================================================================

-- -----------------------------------------------------------------
-- 1. Memberships are marked paid immediately on subscribe now (no
--    real billing exists yet to ever resolve a permanent "pending").
-- -----------------------------------------------------------------
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

update members set payment_status = 'paid' where payment_status = 'pending';

-- -----------------------------------------------------------------
-- 2. plan_items / plan_services — which catalog entries a plan
--    includes. plan_items is what actually drives usage tracking at
--    checkout; plan_services is descriptive (checkout today prices
--    items by their own wash/iron/dryclean columns, not by a
--    services-table row, so it can't gate quota — see items below).
-- -----------------------------------------------------------------
create table if not exists plan_items (
  plan_id uuid not null references subscription_plans(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  primary key (plan_id, item_id)
);

create table if not exists plan_services (
  plan_id uuid not null references subscription_plans(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  primary key (plan_id, service_id)
);

alter table plan_items enable row level security;
alter table plan_services enable row level security;

drop policy if exists "plan_items_public_read" on plan_items;
create policy "plan_items_public_read" on plan_items for select using (true);
drop policy if exists "plan_items_admin_write" on plan_items;
create policy "plan_items_admin_write" on plan_items for all
  using (is_admin()) with check (is_admin());

drop policy if exists "plan_services_public_read" on plan_services;
create policy "plan_services_public_read" on plan_services for select using (true);
drop policy if exists "plan_services_admin_write" on plan_services;
create policy "plan_services_admin_write" on plan_services for all
  using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------
-- 3. orders.user_id — links an order to the account that placed it
--    (nullable: guests can still check out without an account).
-- -----------------------------------------------------------------
alter table orders add column if not exists user_id uuid references auth.users(id);

drop policy if exists "orders_own_read" on orders;
create policy "orders_own_read" on orders for select using (user_id = auth.uid());

-- -----------------------------------------------------------------
-- 4. create_order — now attributes the order to the logged-in caller
--    (if any) and, when that caller has an active+paid membership,
--    counts whichever ordered items are included in that plan
--    against their monthly quota. Items outside the plan are simply
--    billed as-is through the order's own total — never blocked.
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

-- -----------------------------------------------------------------
-- 5. upgrade_membership — switches the caller's own membership to a
--    different plan. Resolves the membership via auth.uid(), never a
--    client-supplied id, so it can't target anyone else's row.
-- -----------------------------------------------------------------
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
-- 6. Security fix: profiles_own_update currently lets a user change
--    ANY column on their own row, including role. Column-level grant
--    restricts self-service updates to full_name only, regardless of
--    what a crafted request tries to send — RLS filters which ROWS,
--    this filters which COLUMNS, and both apply together.
-- -----------------------------------------------------------------
revoke update on profiles from authenticated;
grant update (full_name) on profiles to authenticated;

-- END OF MIGRATION
