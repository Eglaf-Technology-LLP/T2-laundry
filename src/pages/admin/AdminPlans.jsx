import React, { useEffect, useState } from "react";
import { Plus, X, Crown, Trash2, Pencil } from "lucide-react";
import { api } from "@/api/client";

const EMPTY_FORM = {
  name: "", slug: "", tagline: "", price: 0, currency: "QAR", period: "month",
  bookings_per_month: 0, eligible_items: 0, features: "", is_vip: false, popular: false, active: true,
};

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = add, {...plan} = edit
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => api.entities.SubscriptionPlan.list("price").then(setPlans);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing({}); };
  const openEdit = (plan) => {
    setForm({
      name: plan.name || "", slug: plan.slug || "", tagline: plan.tagline || "",
      price: plan.price || 0, currency: plan.currency || "QAR", period: plan.period || "month",
      bookings_per_month: plan.bookings_per_month || 0, eligible_items: plan.eligible_items || 0,
      features: (plan.features || []).join("\n"), is_vip: !!plan.is_vip, popular: !!plan.popular, active: plan.active !== false,
    });
    setEditing(plan);
  };

  const save = async () => {
    if (!form.name) return;
    const payload = {
      ...form,
      price: +form.price,
      bookings_per_month: +form.bookings_per_month,
      eligible_items: +form.eligible_items,
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
    };
    if (editing?.id) await api.entities.SubscriptionPlan.update(editing.id, payload);
    else await api.entities.SubscriptionPlan.create(payload);
    setEditing(null);
    load();
  };

  const remove = async (plan) => {
    await api.entities.SubscriptionPlan.delete(plan.id);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground/55">{plans.length} membership plan{plans.length === 1 ? "" : "s"}</p>
        <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl bg-white p-5 shadow-sm border border-border/60 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate flex items-center gap-1.5" style={{ color: "hsl(var(--navy))" }}>
                  {plan.is_vip && <Crown className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(var(--gold-dark))" }} />}
                  {plan.name}
                </p>
                <p className="text-xs text-foreground/50 truncate">{plan.tagline}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(plan)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(plan)} className="grid h-8 w-8 place-items-center rounded-lg text-foreground/40 hover:text-destructive hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="mt-3 flex items-end gap-1.5">
              <span className="text-2xl font-bold" style={{ color: "hsl(var(--navy))" }}>{plan.price}</span>
              <span className="mb-0.5 text-xs font-mono-label text-foreground/50">{plan.currency}/{plan.period}</span>
            </div>
            <p className="mt-2 text-xs text-foreground/55">{plan.bookings_per_month} bookings · {plan.eligible_items} items /mo</p>
            <ul className="mt-3 space-y-1 flex-1">
              {(plan.features || []).slice(0, 4).map((f) => (
                <li key={f} className="text-xs text-foreground/60 truncate">• {f}</li>
              ))}
              {(plan.features || []).length > 4 && <li className="text-xs text-foreground/40">+{plan.features.length - 4} more</li>}
            </ul>
            {plan.popular && <span className="mt-3 self-start rounded-full bg-[hsl(var(--gold))]/15 px-2.5 py-1 text-[10px] font-mono-label text-[hsl(var(--gold-dark))]">Best Value</span>}
          </div>
        ))}
        {!plans.length && <p className="col-span-full text-sm text-foreground/40 py-10 text-center">No plans yet.</p>}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--navy))" }}>{editing?.id ? "Edit Plan" : "Add Plan"}</h3>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" className="col-span-2"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
              <Field label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" /></Field>
              <Field label="Tagline"><input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="input" /></Field>
              <Field label="Price (QAR)"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" /></Field>
              <Field label="Period"><input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="input" /></Field>
              <Field label="Bookings / month"><input type="number" value={form.bookings_per_month} onChange={(e) => setForm({ ...form, bookings_per_month: e.target.value })} className="input" /></Field>
              <Field label="Eligible items / month"><input type="number" value={form.eligible_items} onChange={(e) => setForm({ ...form, eligible_items: e.target.value })} className="input" /></Field>
              <Field label="Features (one per line)" className="col-span-2">
                <textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="input" rows={6} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Best Value ribbon
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_vip} onChange={(e) => setForm({ ...form, is_vip: e.target.checked })} /> Featured on homepage
              </label>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium">Cancel</button>
              <button onClick={save} className="rounded-xl bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
                {editing?.id ? "Save Changes" : "Create Plan"}
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
