import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Crown, Sparkles, TrendingDown, ShieldCheck, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Subscription() {
  const [plans, setPlans] = useState([]);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    base44.entities.SubscriptionPlan.list().then(setPlans).catch(() => {});
  }, []);

  const vip = plans.find((p) => p.is_vip);
  const payg = plans.find((p) => !p.is_vip);

  const subscribe = async () => {
    if (!vip) return;
    try {
      await base44.entities.Member.create({
        full_name: "New Member",
        phone: "",
        plan_name: vip.name,
        status: "active",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        bookings_used: 0,
        bookings_allowed: vip.bookings_per_month,
        items_used: 0,
        items_allowed: vip.eligible_items,
      });
      setSubscribed(true);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(var(--alabaster))] to-white" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full gold-border px-4 py-2 text-xs font-mono-label text-white">
            <Crown className="h-3.5 w-3.5 text-[hsl(var(--gold-light))]" /> T2 VIP Membership
          </div>
          <h1 className="mt-6 text-5xl sm:text-6xl font-bold" style={{ color: "hsl(var(--navy))" }}>
            One flat rate. <span className="gold-text">Limitless care.</span>
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-foreground/60 text-lg">
            Turn routine laundry into an elite club. Free pickup & delivery, priority booking, and real-time tracking — for {vip ? `${vip.price} ${vip.currency}` : "109 QAR"} a month.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* VIP */}
          {vip && (
            <div className="relative overflow-hidden rounded-[2rem] gold-border p-8 text-white">
              <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #0E2346 0%, #0F172A 60%, #0E2346 100%)" }} />
              <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-[hsl(var(--gold))]/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-mono-label text-[hsl(var(--gold-light))]"><Star className="h-3.5 w-3.5" /> Most Popular</span>
                  <Crown className="h-7 w-7 text-[hsl(var(--gold-light))]" />
                </div>
                <h3 className="mt-5 text-3xl font-bold">{vip.name}</h3>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-bold gold-text">{vip.price}</span>
                  <span className="text-white/60 mb-2 text-sm font-mono-label">{vip.currency}/{vip.period}</span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Pieces / booking" value={vip.pieces_per_booking} />
                  <Stat label="Bookings / month" value={vip.bookings_per_month} />
                  <Stat label="Eligible items" value={vip.eligible_items} />
                </div>

                <ul className="mt-7 space-y-3">
                  {vip.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/85">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--navy))] mt-0.5"><Check className="h-3 w-3" /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                {subscribed ? (
                  <div className="mt-8 rounded-2xl bg-white/10 p-4 text-center text-sm">
                    <ShieldCheck className="h-6 w-6 mx-auto text-[hsl(var(--gold-light))]" />
                    <p className="mt-2">Welcome to T2 VIP! Your membership is active.</p>
                  </div>
                ) : (
                  <button onClick={subscribe} className="mt-8 w-full rounded-full bg-white py-4 text-sm font-bold shimmer-gold" style={{ color: "hsl(var(--navy))" }}>
                    <Sparkles className="inline h-4 w-4 mr-2" /> Activate for {vip.price} {vip.currency}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pay as you go */}
          {payg && (
            <div className="relative overflow-hidden rounded-[2rem] steam-glass p-8 shadow-sm">
              <h3 className="text-3xl font-bold" style={{ color: "hsl(var(--navy))" }}>{payg.name}</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-bold" style={{ color: "hsl(var(--navy))" }}>{payg.price === 0 ? "0" : payg.price}</span>
                <span className="text-foreground/50 mb-2 text-sm font-mono-label">{payg.currency}/{payg.period}</span>
              </div>
              <p className="mt-3 text-sm text-foreground/60">Prefer flexibility? Order individual items or services anytime — no commitment.</p>
              <ul className="mt-6 space-y-3">
                {payg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-foreground/75">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--navy))] text-white mt-0.5"><Check className="h-3 w-3" /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/services" className="mt-8 w-full inline-flex items-center justify-center rounded-full border-2 border-[hsl(var(--navy))] py-4 text-sm font-bold" style={{ color: "hsl(var(--navy))" }}>
                Start an Order
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Savings */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="rounded-[2rem] steam-glass p-10 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 text-[hsl(var(--gold-dark))]" style={{ color: "hsl(var(--gold-dark))" }}>
            <TrendingDown className="h-5 w-5" />
            <span className="font-mono-label text-xs">Why VIP saves you more</span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--navy))" }}>Members save up to 60% vs. pay-as-you-go.</h2>
          <p className="mt-4 text-foreground/60 max-w-2xl mx-auto">With up to 4 service bookings and 20 eligible items a month — plus free pickup & delivery — the 109 QAR plan pays for itself in just a few weekly washes.</p>
          <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[{ n: "80+", l: "Items cared for / month" }, { n: "0 QAR", l: "Pickup & delivery fee" }, { n: "24h", l: "Priority turnaround" }].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-3xl font-bold gold-text">{s.n}</p>
                <p className="mt-1 text-sm text-foreground/55">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 py-3 border border-white/10">
      <p className="text-2xl font-bold gold-text">{value}</p>
      <p className="text-[10px] font-mono-label text-white/50 mt-1">{label}</p>
    </div>
  );
}