import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Crown, Package, ArrowUpCircle, AlertCircle } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import PlanConfirmationModal from "@/components/PlanConfirmationModal";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_facility: "bg-indigo-100 text-indigo-700",
  quality_check: "bg-violet-100 text-violet-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function Account() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);
  const [upgradingId, setUpgradingId] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [confirmation, setConfirmation] = useState(null); // { plan, items, services }

  useEffect(() => {
    setFullName(profile?.full_name || "");
  }, [profile]);

  const load = () => {
    if (!profile) return;
    api.entities.Member.filter({ user_id: profile.id }).then((rows) => setMembership(rows[0] || null)).catch(() => {});
    api.entities.Order.filter({ user_id: profile.id })
      .then((rows) => setOrders([...rows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))))
      .catch(() => {});
    api.entities.SubscriptionPlan.list("price").then(setPlans).catch(() => {});
  };
  useEffect(load, [profile]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.auth.updateProfile({ full_name: fullName });
      await refreshProfile();
    } finally {
      setSavingProfile(false);
    }
  };

  const upgrade = async (plan) => {
    setUpgradingId(plan.id);
    setUpgradeError("");
    try {
      const updated = await api.membership.upgrade(plan.id);
      setMembership(updated);
      setShowUpgrade(false);
      const included = await api.membership.getIncluded(plan.id).catch(() => ({ items: [], services: [] }));
      setConfirmation({ plan, items: included.items, services: included.services });
    } catch (err) {
      setUpgradeError(err?.message || "Something went wrong — please try again.");
    } finally {
      setUpgradingId(null);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>My Account</p>
          <h1 className="mt-3 text-4xl font-bold" style={{ color: "hsl(var(--navy))" }}>Welcome, {profile.full_name || "there"}.</h1>
        </div>

        {/* Profile */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border/60 mb-6">
          <h2 className="flex items-center gap-2 font-semibold" style={{ color: "hsl(var(--navy))" }}><User className="h-4 w-4" /> Profile</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground/50">Full name</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground/50">Email</span>
              <input value={profile.email || ""} disabled className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm text-foreground/50" />
            </label>
          </div>
          <button
            onClick={saveProfile}
            disabled={savingProfile || fullName === (profile.full_name || "")}
            className="mt-4 rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "hsl(var(--navy))" }}
          >
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* Membership */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border/60 mb-6">
          <h2 className="flex items-center gap-2 font-semibold" style={{ color: "hsl(var(--navy))" }}><Crown className="h-4 w-4" /> Membership</h2>

          {membership ? (
            <>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold" style={{ color: "hsl(var(--navy))" }}>{membership.plan_name}</p>
                  <p className="text-xs text-foreground/50">{membership.start_date} → {membership.end_date || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${membership.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{membership.payment_status}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">{membership.status}</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Usage label="Bookings this month" used={membership.bookings_used} total={membership.bookings_allowed} />
                <Usage label="Eligible items this month" used={membership.items_used} total={membership.items_allowed} />
              </div>

              <button onClick={() => setShowUpgrade((v) => !v)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "hsl(var(--navy))" }}>
                <ArrowUpCircle className="h-4 w-4" /> {showUpgrade ? "Hide plans" : "Upgrade plan"}
              </button>

              {upgradeError && (
                <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {upgradeError}
                </div>
              )}

              {showUpgrade && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {plans.filter((p) => p.id !== membership.plan_id).map((p) => (
                    <div key={p.id} className="rounded-xl border border-border p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "hsl(var(--navy))" }}>{p.name}</p>
                        <p className="text-xs text-foreground/50">{p.price} {p.currency}/{p.period}</p>
                      </div>
                      <button
                        onClick={() => upgrade(p)}
                        disabled={upgradingId === p.id}
                        className="shrink-0 rounded-lg bg-[hsl(var(--navy))] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: "hsl(var(--navy))" }}
                      >
                        {upgradingId === p.id ? "Switching…" : "Switch"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 text-center py-6">
              <p className="text-sm text-foreground/55">You don't have a membership yet.</p>
              <Link to="/subscription" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
                <Crown className="h-4 w-4" /> View plans
              </Link>
            </div>
          )}
        </div>

        {/* Past orders */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border/60">
          <h2 className="flex items-center gap-2 font-semibold" style={{ color: "hsl(var(--navy))" }}><Package className="h-4 w-4" /> Past orders</h2>
          <div className="mt-4 space-y-2">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-semibold shrink-0 whitespace-nowrap" style={{ color: "hsl(var(--navy))" }}>{o.order_code}</span>
                  <span className="text-xs text-foreground/50">{o.created_date?.slice(0, 10)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>{o.total} QAR</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[o.status] || ""}`}>{o.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
            {!orders.length && <p className="text-sm text-foreground/40 py-6 text-center">No orders yet — this only shows orders placed while logged in.</p>}
          </div>
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

function Usage({ label, used, total }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-foreground/55">{label}</span>
        <span className="font-medium" style={{ color: "hsl(var(--navy))" }}>{used} / {total}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0E2346, #D4AF37)" }} />
      </div>
    </div>
  );
}
