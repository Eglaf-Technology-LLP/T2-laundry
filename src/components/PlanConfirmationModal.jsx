import React from "react";
import { CheckCircle2, X } from "lucide-react";

// Shown right after a successful subscribe or upgrade — from Subscription.jsx
// (new subscribers) and Account.jsx (upgrades), so both entry points end in
// the same clear "you paid, here's what you get" moment instead of a small
// text banner the user might not even scroll up to see.
export default function PlanConfirmationModal({ plan, items = [], services = [], onClose }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-7 shadow-2xl text-center">
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-bold" style={{ color: "hsl(var(--navy))" }}>Payment successful!</h3>
        <p className="mt-2 text-sm text-foreground/60">
          You're now on the <span className="font-semibold" style={{ color: "hsl(var(--navy))" }}>{plan.name}</span> plan —{" "}
          <span className="font-semibold">{plan.price} {plan.currency}/{plan.period}</span>.
        </p>

        <div className="mt-6 text-left space-y-4">
          <div>
            <p className="text-xs font-mono-label text-foreground/40 mb-2">Included items</p>
            {items.length ? (
              <div className="flex flex-wrap gap-1.5">
                {items.map((i) => <span key={i.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{i.name}</span>)}
              </div>
            ) : (
              <p className="text-xs text-foreground/45">Not set up yet — your admin hasn't attached specific items to this plan.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-mono-label text-foreground/40 mb-2">Included services</p>
            {services.length ? (
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => <span key={s.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{s.name}</span>)}
              </div>
            ) : (
              <p className="text-xs text-foreground/45">Not set up yet — your admin hasn't attached specific services to this plan.</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-[hsl(var(--navy))] py-3 text-sm font-semibold text-white"
          style={{ background: "hsl(var(--navy))" }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
