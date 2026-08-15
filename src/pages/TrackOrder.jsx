import React, { useState } from "react";
import { Search, PackageCheck, Truck, ClipboardList, Sparkles, Home } from "lucide-react";
import { api } from "@/api/client";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "pending", label: "Order Placed", icon: ClipboardList },
  { key: "picked_up", label: "Picked Up", icon: Truck },
  { key: "in_facility", label: "In Facility", icon: Sparkles },
  { key: "quality_check", label: "Quality Check", icon: PackageCheck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
];

export default function TrackOrder() {
  const [code, setCode] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(""); setOrder(null);
    try {
      const res = await api.entities.Order.filter({ order_code: code.trim().toUpperCase() });
      if (res.length) setOrder(res[0]);
      else setError("No order found with that code.");
    } catch (e) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = order ? STAGES.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="min-h-screen mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>Real-Time Tracking</p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold" style={{ color: "hsl(var(--navy))" }}>Track your order.</h1>
        <p className="mt-4 text-foreground/60">Enter your order code to follow your garment's journey.</p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && track()}
          placeholder="e.g. T2-AB12CD"
          className="w-full rounded-full steam-glass py-4 pl-11 pr-32 text-sm shadow-sm outline-none uppercase tracking-wider focus:ring-2 focus:ring-[hsl(var(--gold))]/40"
        />
        <button onClick={track} disabled={loading} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-[hsl(var(--navy))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "hsl(var(--navy))" }}>
          {loading ? "…" : "Track"}
        </button>
      </div>

      {error && <p className="text-center mt-6 text-sm text-destructive">{error}</p>}

      {order && (
        <div className="mt-10 rounded-[2rem] steam-glass p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono-label text-xs text-foreground/40">Order Code</p>
              <p className="font-mono text-2xl font-bold" style={{ color: "hsl(var(--navy))" }}>{order.order_code}</p>
            </div>
            <div className="text-right">
              <p className="font-mono-label text-xs text-foreground/40">Total</p>
              <p className="text-2xl font-bold" style={{ color: "hsl(var(--gold-dark))" }}>{order.total} {order.currency || "QAR"}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8">
            <div className="flex justify-between gap-1">
              {STAGES.map((s, i) => (
                <div key={s.key} className="flex-1 flex flex-col items-center text-center">
                  <div
                    className={cn("grid h-11 w-11 place-items-center rounded-full border-2 transition-all", i <= currentIndex ? "bg-[hsl(var(--navy))] border-[hsl(var(--navy))] text-white" : "bg-white border-border text-foreground/40")}
                    style={i <= currentIndex ? { background: "hsl(var(--navy))", borderColor: "hsl(var(--navy))" } : {}}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className={cn("mt-2 text-[10px] font-mono-label leading-tight", i <= currentIndex ? "text-navy" : "text-foreground/40")} style={i <= currentIndex ? { color: "hsl(var(--navy))" } : {}}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${((currentIndex + 1) / STAGES.length) * 100}%`, background: "linear-gradient(90deg, #0E2346, #D4AF37)" }} />
            </div>
          </div>

          {/* Items */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--navy))" }}>Items in this order</h3>
            <div className="space-y-2">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "hsl(var(--navy))" }}>{it.quantity}× {it.name}</p>
                    <p className="text-xs text-foreground/50">{it.service} · {it.category}</p>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>{it.price * it.quantity} QAR</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white p-4">
              <p className="font-mono-label text-[10px] text-foreground/40">Pickup</p>
              <p className="mt-1 font-medium capitalize">{order.pickup_type} · {order.pickup_slot}</p>
              {order.pickup_date && <p className="text-foreground/50">{order.pickup_date}</p>}
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="font-mono-label text-[10px] text-foreground/40">Customer</p>
              <p className="mt-1 font-medium">{order.customer_name}</p>
              <p className="text-foreground/50">{order.customer_phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}