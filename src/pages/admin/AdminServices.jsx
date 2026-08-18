import React, { useEffect, useState } from "react";
import { Plus, X, Trash2, Pencil, Droplets } from "lucide-react";
import { api } from "@/api/client";

const EMPTY_FORM = { name: "", slug: "", description: "", icon: "Droplets", base_price: 0, turnaround_hours: 24, currency: "QAR", active: true };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // services has no display_order column — sorting by it threw on every
  // load with no .catch(), so the list silently never rendered (this was
  // the real "Add Service isn't working" bug: the insert succeeded, the
  // list just never re-fetched successfully to show it).
  const load = () => api.entities.Service.list("name", 50).then(setServices).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing({}); };
  const openEdit = (s) => {
    setForm({
      name: s.name || "", slug: s.slug || "", description: s.description || "", icon: s.icon || "Droplets",
      base_price: s.base_price || 0, turnaround_hours: s.turnaround_hours || 24, currency: s.currency || "QAR", active: s.active !== false,
    });
    setEditing(s);
  };

  const save = async () => {
    if (!form.name) return;
    const payload = { ...form, base_price: +form.base_price, turnaround_hours: +form.turnaround_hours };
    if (editing?.id) await api.entities.Service.update(editing.id, payload);
    else await api.entities.Service.create(payload);
    setEditing(null);
    load();
  };

  const remove = async (s) => {
    await api.entities.Service.delete(s.id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/55">{services.length} service{services.length === 1 ? "" : "s"}</p>
        <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-5 shadow-sm border border-border/60">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--navy))]/5" style={{ color: "hsl(var(--navy))" }}>
                  <Droplets className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: "hsl(var(--navy))" }}>{s.name}</p>
                  <p className="text-xs text-foreground/50">{s.turnaround_hours}h turnaround</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(s)} className="grid h-8 w-8 place-items-center rounded-lg text-foreground/40 hover:text-destructive hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="mt-3 text-sm text-foreground/60 line-clamp-2">{s.description}</p>
            <p className="mt-3 text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>from {s.base_price} {s.currency || "QAR"}</p>
          </div>
        ))}
        {!services.length && <p className="col-span-full text-sm text-foreground/40 py-10 text-center">No services yet.</p>}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--navy))" }}>{editing?.id ? "Edit Service" : "Add Service"}</h3>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" className="col-span-2"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
              <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" /></Field>
              <Field label="Icon (lucide name)"><input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input" /></Field>
              <Field label="Description" className="col-span-2"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} /></Field>
              <Field label="Base price (QAR)"><input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="input" /></Field>
              <Field label="Turnaround (hours)"><input type="number" value={form.turnaround_hours} onChange={(e) => setForm({ ...form, turnaround_hours: e.target.value })} className="input" /></Field>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
              </label>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={save} className="rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
                {editing?.id ? "Save Changes" : "Create Service"}
              </button>
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
