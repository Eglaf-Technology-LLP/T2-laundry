import React, { useEffect, useMemo, useState } from "react";
import { ShoppingCart, X, Trash2, Truck, Store, Calendar, Clock, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";

const SLOTS = ["08:00 – 10:00", "10:00 – 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00"];

// Splits each line's quantity into a plan-covered (free) portion and a
// billed (extra) portion. Booking quota gates whether ANY free coverage
// applies this order (exhausting bookings_allowed means no more free
// orders this month); item quota is then consumed greedily across lines
// in the order they appear, matching what create_order will count on the
// server once the order is actually placed.
function withPlanSplit(lines, planState) {
  const membership = planState?.membership;
  if (!membership) return lines.map((l) => ({ ...l, freeQty: 0, extraQty: l.quantity }));
  const planItemIds = planState.planItemIds || [];
  const bookingsRemaining = Math.max(0, (membership.bookings_allowed || 0) - (membership.bookings_used || 0));
  let itemsRemaining = bookingsRemaining > 0 ? Math.max(0, (membership.items_allowed || 0) - (membership.items_used || 0)) : 0;
  return lines.map((l) => {
    if (!planItemIds.includes(l.id) || itemsRemaining <= 0) return { ...l, freeQty: 0, extraQty: l.quantity };
    const freeQty = Math.min(l.quantity, itemsRemaining);
    itemsRemaining -= freeQty;
    return { ...l, freeQty, extraQty: l.quantity - freeQty };
  });
}

export default function OrderCart({ lines, items, planState, onQty, onRemove, onClear }) {
  const { isAuthenticated, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ pickup_type: "pickup", pickup_date: "", pickup_slot: SLOTS[0], customer_name: "", customer_phone: "", address: "", notes: "" });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", address_text: "" });

  const splitLines = useMemo(() => withPlanSplit(lines, planState), [lines, planState]);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const billedTotal = splitLines.reduce((s, l) => s + l.extraQty * l.price, 0);
  const planSavings = total - billedTotal;
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const membership = planState?.membership;

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      customer_name: f.customer_name || profile.full_name || "",
      customer_phone: f.customer_phone || profile.phone || "",
    }));
  }, [profile]);

  useEffect(() => {
    if (!isAuthenticated) { setAddresses([]); setAddingAddress(false); return; }
    api.entities.Address.list("-is_default").then((rows) => {
      setAddresses(rows);
      if (rows.length) {
        setSelectedAddressId(rows[0].id);
        setForm((f) => ({ ...f, address: rows[0].address_text }));
      } else {
        setAddingAddress(true);
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onAddressSelect = (e) => {
    const val = e.target.value;
    if (val === "__new__") { setAddingAddress(true); setSelectedAddressId(""); return; }
    setAddingAddress(false);
    setSelectedAddressId(val);
    const addr = addresses.find((a) => a.id === val);
    if (addr) update("address", addr.address_text);
  };

  const saveNewAddress = async () => {
    if (!newAddress.address_text.trim()) return;
    const created = await api.entities.Address.create({
      label: newAddress.label || null,
      address_text: newAddress.address_text,
      is_default: addresses.length === 0,
    });
    setAddresses((prev) => [created, ...prev]);
    setSelectedAddressId(created.id);
    update("address", created.address_text);
    setAddingAddress(false);
    setNewAddress({ label: "", address_text: "" });
  };

  const submit = async () => {
    if (!form.customer_name || !form.customer_phone) return;
    setSubmitting(true);
    try {
      const orderItems = lines.map((l) => ({
        item_id: l.id,
        name: l.name,
        category: l.category,
        service: l.serviceLabel,
        quantity: l.quantity,
        price: l.price,
      }));
      const code = "T2-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      const created = await api.entities.Order.create({
        order_code: code,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: "",
        address: form.address,
        pickup_type: form.pickup_type,
        pickup_date: form.pickup_date,
        pickup_slot: form.pickup_slot,
        items: orderItems,
        total: billedTotal,
        status: "pending",
        payment_status: "unpaid",
        notes: form.notes,
      });
      setPlaced({ code, id: created.id });
      onClear();
    } catch (e) {
      setPlaced({ code: "ERROR" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
        <button
          onClick={() => setOpen(true)}
          disabled={!lines.length}
          className={cn(
            "w-full flex items-center justify-between rounded-2xl px-5 py-4 shadow-xl transition-all",
            lines.length ? "bg-[hsl(var(--navy))] text-white" : "bg-muted text-muted-foreground"
          )}
          style={lines.length ? { background: "hsl(var(--navy))" } : {}}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="h-5 w-5" /> {count} item{count !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-2 text-sm">
            {billedTotal} QAR <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>

      {/* Drawer */}
      <div className={cn("fixed inset-0 z-50 transition-all", open ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-navy/30 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div className={cn("absolute right-0 top-0 h-full w-full max-w-md bg-[hsl(var(--alabaster))] shadow-2xl transition-transform duration-300 flex flex-col", open ? "translate-x-0" : "translate-x-full")}>
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <h3 className="text-lg font-semibold" style={{ color: "hsl(var(--navy))" }}>Your Order</h3>
            <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          {placed ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-[hsl(var(--navy))] text-white">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h4 className="mt-6 text-2xl font-bold" style={{ color: "hsl(var(--navy))" }}>Order placed!</h4>
              <p className="mt-2 text-sm text-foreground/60">Your order code</p>
              <p className="mt-1 font-mono text-3xl font-bold gold-text">{placed.code}</p>
              <p className="mt-4 text-sm text-foreground/60 max-w-xs">We'll send confirmation shortly. Track your garment's journey anytime.</p>
              <a href="/track" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--navy))] px-6 py-3 text-sm font-semibold text-white">
                Track My Order <ArrowRight className="h-4 w-4" />
              </a>
              <button onClick={() => { setPlaced(null); setOpen(false); }} className="mt-4 text-sm text-foreground/50 underline">Place another order</button>
            </div>
          ) : (
            <>
              {/* Everything scrolls together — cart lines and the whole form — so the
                  Confirm Order button below can stay fixed on screen instead of being
                  pushed off the bottom on small screens. */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {lines.length === 0 && (
                  <div className="text-center py-16 text-foreground/50">
                    <ShoppingCart className="h-10 w-10 mx-auto opacity-40" />
                    <p className="mt-3 text-sm">Select a service on any item to start your order.</p>
                  </div>
                )}
                {splitLines.map((l) => (
                  <div key={`${l.id}-${l.serviceKey}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "hsl(var(--navy))" }}>{l.name}</p>
                      {l.freeQty > 0 ? (
                        <p className="text-xs text-emerald-600 font-medium">
                          {l.serviceLabel} · {l.freeQty} FREE{l.extraQty > 0 ? ` + ${l.extraQty} × ${l.price} QAR` : " (plan)"}
                        </p>
                      ) : (
                        <p className="text-xs text-foreground/50">{l.serviceLabel} · {l.price} QAR</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => onQty(items.find((i) => i.id === l.id), l.serviceKey, -1)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted hover:bg-[hsl(var(--navy))] hover:text-white">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                      <button onClick={() => onQty(items.find((i) => i.id === l.id), l.serviceKey, 1)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted hover:bg-[hsl(var(--navy))] hover:text-white">+</button>
                    </div>
                    <button onClick={() => onRemove(l.id, l.serviceKey)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-foreground/40 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {lines.length > 0 && (
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    {membership && (
                      <div className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                        {membership.bookings_used}/{membership.bookings_allowed} bookings · {membership.items_used}/{membership.items_allowed} items used this month
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/60">Subtotal</span>
                      <span className="font-semibold">{total} QAR</span>
                    </div>
                    {planSavings > 0 && (
                      <div className="flex items-center justify-between text-sm text-emerald-600 font-medium -mt-2">
                        <span>Plan savings</span>
                        <span>−{planSavings} QAR</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[{ k: "pickup", l: "Pickup", I: Truck }, { k: "drop", l: "Drop at shop", I: Store }].map((o) => (
                          <button
                            key={o.k}
                            onClick={() => update("pickup_type", o.k)}
                            className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border transition-all", form.pickup_type === o.k ? "bg-[hsl(var(--navy))] text-white border-transparent" : "bg-white border-border")}
                            style={form.pickup_type === o.k ? { background: "hsl(var(--navy))" } : {}}
                          >
                            <o.I className="h-4 w-4" /> {o.l}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-foreground/50 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</span>
                          <input type="date" value={form.pickup_date} onChange={(e) => update("pickup_date", e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm" />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-foreground/50 flex items-center gap-1"><Clock className="h-3 w-3" /> Slot</span>
                          <select value={form.pickup_slot} onChange={(e) => update("pickup_slot", e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm">
                            {SLOTS.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </label>
                      </div>

                      <input placeholder="Full name" value={form.customer_name} onChange={(e) => update("customer_name", e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
                      <input placeholder="Phone number" value={form.customer_phone} onChange={(e) => update("customer_phone", e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
                      {form.pickup_type === "pickup" && (
                        isAuthenticated ? (
                          <div className="space-y-2">
                            {addresses.length > 0 && !addingAddress && (
                              <select value={selectedAddressId} onChange={onAddressSelect} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
                                {addresses.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.label ? `${a.label} — ` : ""}{a.address_text.slice(0, 60)}{a.is_default ? " (default)" : ""}
                                  </option>
                                ))}
                                <option value="__new__">+ Add new address</option>
                              </select>
                            )}
                            {(addingAddress || addresses.length === 0) && (
                              <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
                                <input
                                  placeholder="Label (e.g. Home, Office)"
                                  value={newAddress.label}
                                  onChange={(e) => setNewAddress((f) => ({ ...f, label: e.target.value }))}
                                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                                />
                                <textarea
                                  placeholder="Full address"
                                  value={newAddress.address_text}
                                  onChange={(e) => setNewAddress((f) => ({ ...f, address_text: e.target.value }))}
                                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button type="button" onClick={saveNewAddress} className="flex-1 rounded-lg bg-[hsl(var(--navy))] py-2 text-xs font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
                                    Save &amp; use this address
                                  </button>
                                  {addresses.length > 0 && (
                                    <button type="button" onClick={() => setAddingAddress(false)} className="rounded-lg border border-border px-3 py-2 text-xs">Cancel</button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <textarea placeholder="Pickup address" value={form.address} onChange={(e) => update("address", e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" rows={2} />
                        )
                      )}
                      <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => update("notes", e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed on screen regardless of how tall the scrollable content above gets. */}
              {lines.length > 0 && (
                <div className="shrink-0 border-t border-border p-4 bg-white/90 backdrop-blur">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold" style={{ color: "hsl(var(--navy))" }}>Total</span>
                    <span className="text-2xl font-bold" style={{ color: "hsl(var(--gold-dark))" }}>{billedTotal} QAR</span>
                  </div>
                  <button
                    onClick={submit}
                    disabled={submitting || !form.customer_name || !form.customer_phone}
                    className="w-full rounded-xl bg-[hsl(var(--navy))] py-3.5 text-sm font-semibold text-white disabled:opacity-50 transition-transform hover:scale-[1.02]"
                  >
                    {submitting ? "Placing order…" : `Confirm Order · ${billedTotal} QAR`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
