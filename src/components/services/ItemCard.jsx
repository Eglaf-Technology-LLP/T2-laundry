import React from "react";
import { Plus, Minus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_OPTIONS = [
  { key: "wash_price", label: "Wash" },
  { key: "iron_price", label: "Iron" },
  { key: "wash_iron_price", label: "Wash & Iron" },
  { key: "dryclean_price", label: "Dry Clean" },
];

export default function ItemCard({ item, line, onSelectService, onQty }) {
  const available = SERVICE_OPTIONS.filter((o) => (item[o.key] || 0) > 0);
  const active = line?.serviceKey;

  return (
    <div className="group relative rounded-3xl steam-glass p-5 shadow-sm hover:shadow-lg hover:shadow-navy/5 transition-all duration-500 hover:-translate-y-0.5">
      {item.popular && (
        <span className="absolute -top-2 right-4 rounded-full bg-[hsl(var(--gold))] px-3 py-1 text-[10px] font-mono-label text-[hsl(var(--navy))] shadow">Popular</span>
      )}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: "hsl(var(--navy))" }}>{item.name}</h3>
        <span className="font-mono-label text-[10px] text-foreground/40">{item.category}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {available.map((o) => {
          const isActive = active === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onSelectService(item, o.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isActive ? "bg-[hsl(var(--navy))] text-white shadow" : "bg-white/70 text-foreground/70 hover:bg-white"
              )}
              style={isActive ? { background: "hsl(var(--navy))" } : {}}
            >
              {o.label} · {item[o.key]} QAR
            </button>
          );
        })}
      </div>

      {line && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/70 p-2">
          <div className="flex items-center gap-1">
            <button onClick={() => onQty(item, line.serviceKey, -1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm hover:bg-[hsl(var(--navy))] hover:text-white transition-colors">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
            <button onClick={() => onQty(item, line.serviceKey, 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white shadow-sm hover:bg-[hsl(var(--navy))] hover:text-white transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>{line.price * line.quantity} QAR</span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[hsl(var(--navy))] text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}