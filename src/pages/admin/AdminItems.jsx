import React, { useEffect, useState } from "react";
import { Plus, Trash2, X, Star, Search } from "lucide-react";
import { api } from "@/api/client";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", wash_price: 0, iron_price: 0, wash_iron_price: 0, dryclean_price: 0, popular: false });

  const load = async () => {
    const [i, c] = await Promise.all([api.entities.Item.list("display_order", 200), api.entities.Category.list("display_order", 50)]);
    setItems(i); setCats(c);
    if (c.length && !form.category) setForm((f) => ({ ...f, category: c[0].name }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const create = async () => {
    if (!form.name || !form.category) return;
    await api.entities.Item.create({ ...form, display_order: items.length + 1, active: true, eligible_subscription: true });
    setForm({ name: "", category: form.category, wash_price: 0, iron_price: 0, wash_iron_price: 0, dryclean_price: 0, popular: false });
    setShowForm(false);
    load();
  };

  const togglePopular = async (it) => {
    await api.entities.Item.update(it.id, { popular: !it.popular });
    load();
  };

  const remove = async (it) => {
    await api.entities.Item.delete(it.id);
    load();
  };

  const filtered = items.filter((it) => {
    const cOk = filter === "All" || it.category === filter;
    const qOk = !query || it.name.toLowerCase().includes(query.toLowerCase());
    return cOk && qOk;
  });

  const num = (v) => (v ? `${v} QAR` : "—");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items…" className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm" />
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {["All", ...cats.map((c) => c.name)].map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-medium ${filter === c ? "bg-[hsl(var(--navy))] text-white" : "bg-white border border-border text-foreground/60"}`} style={filter === c ? { background: "hsl(var(--navy))" } : {}}>
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white shadow-sm border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left font-mono-label text-[10px] text-foreground/50">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Wash</th>
              <th className="px-4 py-3 text-right">Iron</th>
              <th className="px-4 py-3 text-right">W&I</th>
              <th className="px-4 py-3 text-right">Dry Clean</th>
              <th className="px-4 py-3 text-center">Popular</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium" style={{ color: "hsl(var(--navy))" }}>{it.name}</td>
                <td className="px-4 py-3 text-foreground/60">{it.category}</td>
                <td className="px-4 py-3 text-right text-foreground/70">{num(it.wash_price)}</td>
                <td className="px-4 py-3 text-right text-foreground/70">{num(it.iron_price)}</td>
                <td className="px-4 py-3 text-right text-foreground/70">{num(it.wash_iron_price)}</td>
                <td className="px-4 py-3 text-right text-foreground/70">{num(it.dryclean_price)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => togglePopular(it)}>
                    <Star className={`h-4 w-4 mx-auto ${it.popular ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-foreground/30"}`} style={it.popular ? { color: "hsl(var(--gold))" } : {}} />
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(it)} className="grid h-8 w-8 place-items-center rounded-lg text-foreground/40 hover:text-destructive hover:bg-rose-50 ml-auto">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-foreground/40">No items.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--navy))" }}>Add Item</h3>
              <button onClick={() => setShowForm(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" className="col-span-2"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
              <Field label="Category" className="col-span-2">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                  {cats.map((c) => <option key={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Wash (QAR)"><input type="number" value={form.wash_price} onChange={(e) => setForm({ ...form, wash_price: +e.target.value })} className="input" /></Field>
              <Field label="Iron (QAR)"><input type="number" value={form.iron_price} onChange={(e) => setForm({ ...form, iron_price: +e.target.value })} className="input" /></Field>
              <Field label="Wash & Iron (QAR)"><input type="number" value={form.wash_iron_price} onChange={(e) => setForm({ ...form, wash_iron_price: +e.target.value })} className="input" /></Field>
              <Field label="Dry Clean (QAR)"><input type="number" value={form.dryclean_price} onChange={(e) => setForm({ ...form, dryclean_price: +e.target.value })} className="input" /></Field>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Mark as popular
              </label>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={create} className="rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>Create Item</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:white;padding:0.5rem 0.75rem;font-size:0.875rem;}`}</style>
    </div>
  );
}

function Field({ label, children, className }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="text-xs font-medium text-foreground/50">{label}</span>
      {children}
    </label>
  );
}