import React from "react";
import { Plus, Minus, Check, Droplets, Wind, WashingMachine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_OPTIONS = [
  { key: "wash_price", label: "Wash", icon: Droplets },
  { key: "iron_price", label: "Iron", icon: Wind },
  { key: "wash_iron_price", label: "Wash & Iron", icon: WashingMachine },
  { key: "dryclean_price", label: "Dry Clean", icon: Sparkles },
];

export default function ItemCard({ item, lines = [], onSelectService, onQty }) {
  const available = SERVICE_OPTIONS.filter((o) => (item[o.key] || 0) > 0);
  const lineFor = (key) => lines.find((l) => l.serviceKey === key);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <div className="group relative rounded-3xl steam-glass p-5 shadow-sm hover:shadow-lg hover:shadow-navy/5 transition-all duration-500 hover:-translate-y-0.5">
      {item.popular && (
        <span className="absolute -top-2 right-4 rounded-full bg-[hsl(var(--gold))] px-3 py-1 text-[10px] font-mono-label text-[hsl(var(--navy))] shadow">Popular</span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: "hsl(var(--navy))" }}>{item.name}</h3>
        <span className="font-mono-label text-[10px] text-foreground/40">{item.category}</span>
      </div>

      <p className="mt-3 text-[10px] font-mono-label text-foreground/40">Pick any combination of services</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {available.map((o) => {
          const line = lineFor(o.key);
          const isActive = !!line;

          if (!isActive) {
            return (
              <button
                key={o.key}
                onClick={() => onSelectService(item, o.key)}
                className="flex flex-col items-start gap-1.5 rounded-2xl border border-border/60 bg-white/70 px-3 py-2.5 text-left text-foreground/70 transition-all hover:border-[hsl(var(--gold))]/40 hover:bg-white"
              >
                <o.icon className="h-4 w-4 text-foreground/40" />
                <span className="text-xs font-semibold leading-tight">{o.label}</span>
                <span className="text-xs font-mono-label text-foreground/50">{item[o.key]} QAR</span>
              </button>
            );
          }

          return (
            <div
              key={o.key}
              className="relative flex flex-col gap-2 rounded-2xl border border-transparent px-3 py-2.5 text-white shadow-md"
              style={{ background: "hsl(var(--navy))" }}
            >
              <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[hsl(var(--gold))]" style={{ color: "hsl(var(--navy))" }}>
                <Check className="h-2.5 w-2.5" />
              </span>
              <o.icon className="h-4 w-4 text-[hsl(var(--gold-light))]" />
              <span className="text-xs font-semibold leading-tight pr-4">{o.label}</span>

              <div className="flex items-center gap-1">
                <button onClick={() => onQty(item, o.key, -1)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/15 hover:bg-white/25 transition-colors">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-xs font-semibold">{line.quantity}</span>
                <button onClick={() => onQty(item, o.key, 1)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/15 hover:bg-white/25 transition-colors">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <span className="text-xs font-mono-label text-white/85">{item[o.key] * line.quantity} QAR</span>
            </div>
          );
        })}
      </div>

      {lines.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 p-3">
          <span className="text-xs text-foreground/60">{lines.length} service{lines.length > 1 ? "s" : ""} selected</span>
          <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>{total} QAR</span>
        </div>
      )}
    </div>
  );
}
