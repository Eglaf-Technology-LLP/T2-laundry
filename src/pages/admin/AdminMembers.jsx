import React, { useEffect, useState } from "react";
import { Plus, X, Crown, Trash2, Search } from "lucide-react";
import { api } from "@/api/client";

const STATUS_STYLE = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-rose-100 text-rose-700",
  paused: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-200 text-slate-700",
};

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", plan_name: "T2 VIP", status: "active" });

  const load = () => api.entities.Member.list().then(setMembers);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.full_name || !form.phone) return;
    await api.entities.Member.create({
      ...form,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      bookings_used: 0, bookings_allowed: 4, items_used: 0, items_allowed: 20,
    });
    setForm({ full_name: "", email: "", phone: "", plan_name: "T2 VIP", status: "active" });
    setShowForm(false);
    load();
  };

  const remove = async (m) => { await api.entities.Member.delete(m.id); load(); };

  const filtered = members.filter((m) => !query || m.full_name.toLowerCase().includes(query.toLowerCase()) || (m.email || "").toLowerCase().includes(query.toLowerCase()));

  const stats = {
    total: members.length,
    vip: members.filter((m) => m.plan_name === "T2 VIP").length,
    active: members.filter((m) => m.status === "active").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: "Total Members", v: stats.total, icon: Plus },
          { l: "VIP Members", v: stats.vip, icon: Crown, gold: true },
          { l: "Active Now", v: stats.active, icon: X },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-white p-5 shadow-sm border border-border/60">
            <p className="text-3xl font-bold" style={s.gold ? { color: "hsl(var(--gold-dark))" } : { color: "hsl(var(--navy))" }}>{s.v}</p>
            <p className="mt-1 text-sm text-foreground/55">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members…" className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm" />
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm border border-border/60">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--navy))] text-white font-semibold shrink-0" style={{ background: "hsl(var(--navy))" }}>
                  {m.full_name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: "hsl(var(--navy))" }}>{m.full_name}</p>
                  <p className="text-xs text-foreground/50 truncate">{m.email || m.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[m.status] || ""}`}>{m.status}</span>
                <button onClick={() => remove(m)} className="grid h-7 w-7 place-items-center rounded-lg text-foreground/40 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={m.plan_name === "T2 VIP" ? { color: "hsl(var(--gold-dark))" } : { color: "hsl(var(--navy))" }}>
                {m.plan_name === "T2 VIP" && <Crown className="h-3.5 w-3.5" />} {m.plan_name}
              </span>
              <span className="text-xs text-foreground/50">{m.start_date} → {m.end_date || "—"}</span>
            </div>

            {m.plan_name === "T2 VIP" && (
              <div className="mt-4 space-y-3">
                <Usage label="Bookings" used={m.bookings_used} total={m.bookings_allowed} />
                <Usage label="Eligible items" used={m.items_used} total={m.items_allowed} />
              </div>
            )}
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-foreground/40 py-10 text-center col-span-2">No members.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--navy))" }}>Add Member</h3>
              <button onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
              <select value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
                <option>T2 VIP</option>
                <option>Pay As You Go</option>
              </select>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={create} className="rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>Add Member</button>
            </div>
          </div>
        </div>
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