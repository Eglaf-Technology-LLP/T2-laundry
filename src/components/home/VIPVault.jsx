import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Crown, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function VIPVault() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    base44.entities.SubscriptionPlan.filter({ is_vip: true }).then((r) => setPlan(r[0] || null)).catch(() => {});
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <div className="relative overflow-hidden rounded-[2rem] gold-border p-8 sm:p-12 lg:p-16 text-white">
        <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #0E2346 0%, #0F172A 60%, #0E2346 100%)" }} />
        <div className="absolute -top-20 -right-10 h-72 w-72 rounded-full bg-[hsl(var(--gold))]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[hsl(var(--cerulean))]/15 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-mono-label text-[hsl(var(--gold-light))]">
              <Crown className="h-3.5 w-3.5" /> The VIP Subscription Vault
            </div>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">
              Membership with <span className="gold-text">privilege.</span>
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed max-w-md">
              T2 VIP turns routine garment care into an elite club. Free pickup & delivery, priority booking, and real-time tracking — for one flat monthly rate.
            </p>

            {plan && (
              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-bold gold-text">{plan.price}</span>
                <span className="text-white/60 mb-2 font-mono-label text-xs">{plan.currency} / {plan.period}</span>
              </div>
            )}

            <Link to="/subscription" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-[hsl(var(--navy)] transition-transform hover:scale-[1.03] shimmer-gold" style={{ color: "hsl(var(--navy))" }}>
              <Sparkles className="h-4 w-4" /> Activate VIP Membership
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {plan?.features?.map((f) => (
              <div key={f} className="flex items-start gap-3 rounded-2xl bg-white/5 backdrop-blur p-4 border border-white/10">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--navy))]">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-white/85 leading-snug">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}