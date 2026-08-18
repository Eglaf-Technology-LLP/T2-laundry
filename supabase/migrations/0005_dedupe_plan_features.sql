-- =================================================================
-- T2 Laundry — Migration 0005: dedupe subscription_plans.features.
--
-- The Family and VIP plans both had "Priority Support" listed twice
-- (seed-data copy/paste), which customers saw duplicated on the plan
-- cards and also broke React's list rendering (features were keyed by
-- their own text, so a duplicate line collided). The frontend fix no
-- longer depends on unique text, but the live data still needs fixing.
--
-- Generic on purpose — dedupes every plan's features array, preserving
-- first-occurrence order, so this is also a safety net if an admin
-- retypes a duplicate line via the plan editor in the future.
--
-- Idempotent — safe to run on the already-provisioned project. Run
-- this whole file in the Supabase SQL editor.
-- =================================================================

update subscription_plans
set features = coalesce((
  select jsonb_agg(elem order by first_ord)
  from (
    select elem, min(ord) as first_ord
    from jsonb_array_elements_text(features) with ordinality as t(elem, ord)
    group by elem
  ) dedup
), '[]'::jsonb)
where features is not null;

-- END OF MIGRATION
