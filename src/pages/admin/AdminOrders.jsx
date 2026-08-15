import React, { useEffect, useState } from "react";
import { Search, ChevronRight, CheckCircle2 } from "lucide-react";
import { api } from "@/api/client";

const STAGES = ["pending", "picked_up", "in_facility", "quality_check", "out_for_delivery", "delivered"];
const STAGE_LABELS = {
  pending: "Order Placed", picked_up: "Picked Up", in_facility: "In Facility",
  quality_check: "Quality Check", out_for_delivery: "Out for Delivery", delivered: "Delivered",
};
const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_facility: "bg-indigo-100 text-indigo-700",
  quality_check: "bg-violet-100 text-violet-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const load = () => api.entities.Order.list("-created_date", 100).then(setOrders);
  useEffect(() => { load(); }, []);

  const advance = async (o) => {
    const idx = STAGES.indexOf(o.status);
    if (idx < STAGES.length - 1) {
      await api.entities.Order.update(o.id, { status: STAGES[idx + 1] });
      load();
      setSelected((s) => (s && s.id === o.id ? { ...s, status: STAGES[idx + 1] } : s));
    }
  };

  const cancel = async (o) => {
    await api.entities.Order.update(o.id, { status: "cancelled" });
    load();
    setSelected((s) => (s && s.id === o.id ? { ...s, status: "cancelled" } : s));
  };

  const filtered = orders.filter((o) => {
    const qOk = !query || o.order_code.toLowerCase().includes(query.toLowerCase()) || o.customer_name.toLowerCase().includes(query.toLowerCase());
    const fOk = filter === "all" || o.status === filter;
    return qOk && fOk;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code or customer…" className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {["all", ...STAGES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium capitalize ${filter === s ? "bg-[hsl(var(--navy))] text-white" : "bg-white border border-border text-foreground/60"}`} style={filter === s ? { background: "hsl(var(--navy))" } : {}}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => setSelected(o)} className={`w-full text-left rounded-2xl bg-white p-4 shadow-sm border transition-all ${selected?.id === o.id ? "border-[hsl(var(--gold))]" : "border-border/60 hover:border-[hsl(var(--gold))]/40"}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-sm font-semibold shrink-0 whitespace-nowrap" style={{ color: "hsl(var(--navy))" }}>{o.order_code}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--navy))" }}>{o.customer_name}</p>
                    <p className="text-xs text-foreground/50">{o.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>{o.total} QAR</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[o.status] || ""}`}>{o.status.replace("_", " ")}</span>
                </div>
              </div>
            </button>
          ))}
          {!filtered.length && <p className="text-sm text-foreground/40 py-10 text-center">No orders match.</p>}
        </div>

        {/* Detail / logistics pulse */}
        <div className="lg:col-span-1">
          {selected ? (
            <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-sm border border-border/60">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold" style={{ color: "hsl(var(--navy))" }}>{selected.order_code}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[selected.status] || ""}`}>{selected.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/60">{selected.customer_name} · {selected.customer_phone}</p>

              <div className="mt-5">
                <p className="font-mono-label text-[10px] text-foreground/40 mb-3">Logistics Pulse</p>
                <div className="space-y-1">
                  {STAGES.map((s, i) => {
                    const activeIdx = STAGES.indexOf(selected.status);
                    const done = i <= activeIdx;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <div className={`h-7 w-7 rounded-full grid place-items-center text-xs ${done ? "bg-[hsl(var(--navy))] text-white" : "bg-muted text-foreground/40"}`} style={done ? { background: "hsl(var(--navy))" } : {}}>
                            {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                          </div>
                        <span className={`text-sm ${done ? "font-medium" : "text-foreground/50"}`} style={done ? { color: "hsl(var(--navy))" } : {}}>{STAGE_LABELS[s]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-muted/50 p-3">
                <p className="font-mono-label text-[10px] text-foreground/40">Items</p>
                <div className="mt-2 space-y-1">
                  {(selected.items || []).map((it, i) => (
                    <p key={i} className="text-sm text-foreground/70">{it.quantity}× {it.name} <span className="text-foreground/40">· {it.service}</span></p>
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>Total: {selected.total} QAR</p>
              </div>

              {selected.status !== "delivered" && selected.status !== "cancelled" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => advance(selected)} className="flex-1 rounded-xl bg-[hsl(var(--navy))] py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-1" style={{ background: "hsl(var(--navy))" }}>
                    Advance <ChevronRight className="h-4 w-4" />
                  </button>
                  <button onClick={() => cancel(selected)} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600">Cancel</button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center text-foreground/40 border border-dashed border-border">
              Select an order to view its logistics timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}