import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Crown, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import Reveal from "@/components/home/Reveal";
import PlanConfirmationModal from "@/components/PlanConfirmationModal";

export default function Subscription() {
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [subscribingId, setSubscribingId] = useState(null);
  const [justSubscribed, setJustSubscribed] = useState(null);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null); // { plan, items, services }

  useEffect(() => {
    api.entities.SubscriptionPlan.list("price").then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated || !profile) { setMembershipChecked(true); return; }
    api.entities.Member.filter({ user_id: profile.id })
      .then((rows) => setMyMembership(rows[0] || null))
      .catch(() => {})
      .finally(() => setMembershipChecked(true));
  }, [isAuthenticated, isLoadingAuth, profile]);

  const createFreshMembership = async (plan) => {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    return api.entities.Member.create({
      plan_id: plan.id,
      plan_name: plan.name,
      full_name: profile.full_name || "Member",
      phone: "",
      status: "active",
      start_date: today,
      end_date: end,
      bookings_used: 0,
      bookings_allowed: plan.bookings_per_month,
      items_used: 0,
      items_allowed: plan.eligible_items,
    });
  };

  const subscribe = async (plan) => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      navigate(`/signup?next=/subscription&plan=${plan.id}`);
      return;
    }
    setSubscribingId(plan.id);
    setError("");
    try {
      let member;
      if (myMembership) {
        // Already a member — switch their existing row to the new plan
        // instead of inserting a second one. Falls back to a fresh insert
        // if the existing row predates account linking and can't be found
        // by the RPC (auth.uid()-scoped update matches zero rows).
        try {
          member = await api.membership.upgrade(plan.id);
        } catch {
          member = await createFreshMembership(plan);
        }
      } else {
        member = await createFreshMembership(plan);
      }
      setMyMembership(member);
      setJustSubscribed(plan.name);
      const included = await api.membership.getIncluded(plan.id).catch(() => ({ items: [], services: [] }));
      setConfirmation({ plan, items: included.items, services: included.services });
    } catch (err) {
      setError(err?.message || "Something went wrong — please try again.");
    } finally {
      setSubscribingId(null);
    }
  };

  // Completes the purchase that was interrupted by the signup/login detour:
  // Subscribe Now -> /signup?...&plan=<id> -> back here still carrying ?plan=.
  // Without this, the plan choice was silently dropped and nothing was ever
  // actually subscribed — the user had to notice and click Subscribe again.
  useEffect(() => {
    const pendingPlanId = searchParams.get("plan");
    if (!pendingPlanId || !membershipChecked || !isAuthenticated || !plans.length) return;
    setSearchParams((p) => { p.delete("plan"); return p; }, { replace: true });
    if (myMembership) return; // already subscribed to something, don't double up
    const plan = plans.find((p) => p.id === pendingPlanId);
    if (plan) subscribe(plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, membershipChecked, isAuthenticated, plans, myMembership]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(var(--alabaster))] to-white" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full gold-border px-4 py-2 text-xs font-mono-label text-white">
            <Crown className="h-3.5 w-3.5 text-[hsl(var(--gold-light))]" /> Membership Plans
          </div>
          <h1 className="mt-6 text-5xl sm:text-6xl font-bold" style={{ color: "hsl(var(--navy))" }}>
            One membership. <span className="gold-text">Limitless care.</span>
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-foreground/60 text-lg">
            From individuals to families — free pickup & delivery, priority booking and real-time tracking on every tier.
          </p>
        </div>
      </section>

      {error && (
        <section className="mx-auto max-w-3xl px-4 sm:px-6 -mt-4 mb-4">
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3 text-rose-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        </section>
      )}

      {(justSubscribed || myMembership) && (
        <section className="mx-auto max-w-3xl px-4 sm:px-6 -mt-4 mb-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm border border-border/60 flex items-center gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[hsl(var(--navy))] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "hsl(var(--navy))" }}>
                You're on the {myMembership?.plan_name || justSubscribed} plan
              </p>
              <p className="text-sm text-foreground/55">
                {myMembership?.payment_status === "paid" ? "Payment confirmed." : "Payment pending — we'll follow up to confirm billing."}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.08}>
              <PlanCard
                plan={plan}
                isCurrent={myMembership?.plan_id === plan.id}
                isUpgrade={!!myMembership && myMembership.plan_id !== plan.id}
                submitting={subscribingId === plan.id}
                onSubscribe={() => subscribe(plan)}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {confirmation && (
        <PlanConfirmationModal
          plan={confirmation.plan}
          items={confirmation.items}
          services={confirmation.services}
          onClose={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, isCurrent, isUpgrade, submitting, onSubscribe }) {
  const featured = plan.popular;

  return (
    <div
      className={
        featured
          ? "relative flex h-full flex-col overflow-hidden rounded-[2rem] gold-border p-7 text-white"
          : "relative flex h-full flex-col overflow-hidden rounded-[2rem] steam-glass p-7 shadow-sm"
      }
    >
      {featured && (
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #0E2346 0%, #0F172A 60%, #0E2346 100%)" }} />
      )}
      {featured && (
        <span className="absolute right-6 top-6 rounded-full bg-[hsl(var(--gold))] px-3 py-1 text-[10px] font-mono-label text-[hsl(var(--navy))] shadow">
          Best Value
        </span>
      )}

      <h3 className="text-2xl font-bold" style={featured ? {} : { color: "hsl(var(--navy))" }}>{plan.name}</h3>
      <p className={featured ? "mt-1 text-sm text-white/65" : "mt-1 text-sm text-foreground/55"}>{plan.tagline}</p>

      <div className="mt-5 flex items-end gap-1.5">
        <span className={featured ? "text-4xl font-bold gold-text" : "text-4xl font-bold"} style={featured ? {} : { color: "hsl(var(--navy))" }}>{plan.price}</span>
        <span className={featured ? "mb-1 text-xs font-mono-label text-white/60" : "mb-1 text-xs font-mono-label text-foreground/50"}>QAR / {plan.period}</span>
      </div>

      <ul className="mt-6 space-y-2.5 flex-1">
        {(plan.features || []).map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span
              className={
                featured
                  ? "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--navy))] mt-0.5"
                  : "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--navy))]/10 text-[hsl(var(--navy))] mt-0.5"
              }
            >
              <Check className="h-3 w-3" />
            </span>
            <span className={featured ? "text-white/85 leading-snug" : "text-foreground/70 leading-snug"}>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2">
        {isCurrent ? (
          <div className={featured ? "rounded-xl bg-white/10 py-3 text-center text-sm font-semibold" : "rounded-xl bg-muted py-3 text-center text-sm font-semibold"} style={featured ? {} : { color: "hsl(var(--navy))" }}>
            Your current plan
          </div>
        ) : (
          <button
            onClick={onSubscribe}
            disabled={submitting}
            className={
              featured
                ? "w-full rounded-xl bg-white py-3 text-sm font-bold shimmer-gold disabled:opacity-60"
                : "w-full rounded-xl bg-[hsl(var(--navy))] py-3 text-sm font-semibold text-white disabled:opacity-60"
            }
            style={featured ? { color: "hsl(var(--navy))" } : { background: "hsl(var(--navy))" }}
          >
            {submitting ? (isUpgrade ? "Upgrading…" : "Subscribing…") : (
              <span className="inline-flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" /> {isUpgrade ? "Upgrade to This Plan" : "Subscribe Now"}
              </span>
            )}
          </button>
        )}
        <Link
          to="/services"
          className={featured ? "block w-full rounded-xl border border-white/20 py-3 text-center text-sm font-medium text-white/85" : "block w-full rounded-xl border border-border py-3 text-center text-sm font-medium text-foreground/70"}
        >
          View Items
        </Link>
      </div>
    </div>
  );
}
