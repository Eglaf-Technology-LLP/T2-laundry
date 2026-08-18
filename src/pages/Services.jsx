import React, { useEffect, useState, useMemo } from "react";
import { Search, Package, ShieldCheck } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import ItemCard from "@/components/services/ItemCard";
import OrderCart from "@/components/services/OrderCart";

const SERVICE_LABELS = { wash_price: "Wash", iron_price: "Iron", wash_iron_price: "Wash & Iron", dryclean_price: "Dry Clean" };

export default function Services() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [activeCat, setActiveCat] = useState("All");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]);
  const [planState, setPlanState] = useState({ membership: null, planItemIds: [] });
  const [planIncluded, setPlanIncluded] = useState({ items: [], services: [] });

  useEffect(() => {
    Promise.all([
      api.entities.Item.list("display_order", 100),
      api.entities.Category.list("display_order", 50),
    ]).then(([i, c]) => {
      setItems(i);
      setCats([{ name: "All", slug: "all" }, ...c]);
    });
  }, []);

  // Drives the "Included in your plan" badges below and the free-vs-extra
  // split in the cart — only meaningful for a logged-in member.
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) { setPlanState({ membership: null, planItemIds: [] }); setPlanIncluded({ items: [], services: [] }); return; }
    api.membership.getMyPlanState().then((state) => {
      setPlanState(state);
      if (state.membership) {
        api.membership.getIncluded(state.membership.plan_id).then(setPlanIncluded).catch(() => {});
      } else {
        setPlanIncluded({ items: [], services: [] });
      }
    }).catch(() => {});
  }, [isAuthenticated, isLoadingAuth]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const catOk = activeCat === "All" || it.category === activeCat;
      const qOk = !query || it.name.toLowerCase().includes(query.toLowerCase());
      return catOk && qOk && it.active;
    });
  }, [items, activeCat, query]);

  const addLine = (item, serviceKey) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === item.id && l.serviceKey === serviceKey);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { id: item.id, name: item.name, category: item.category, serviceKey, serviceLabel: SERVICE_LABELS[serviceKey], price: item[serviceKey], quantity: 1 }];
    });
  };

  const changeQty = (item, serviceKey, delta) => {
    if (!item || !serviceKey) return;
    setLines((prev) => prev
      .map((l) => (l.id === item.id && l.serviceKey === serviceKey ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
      .filter((l) => l.quantity > 0));
  };

  const removeLine = (id, serviceKey) => setLines((prev) => prev.filter((l) => !(l.id === id && l.serviceKey === serviceKey)));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-32">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>Order Individual Items</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold" style={{ color: "hsl(var(--navy))" }}>The Garment Matrix.</h1>
          <p className="mt-4 text-foreground/60">Choose items, pick a service, and build your order. Transparent pricing, every garment.</p>
        </div>

        {planState.membership && (planIncluded.items.length > 0 || planIncluded.services.length > 0) && (
          <div className="max-w-3xl mx-auto mb-8 rounded-2xl steam-glass p-5">
            <p className="flex items-center gap-2 text-xs font-mono-label" style={{ color: "hsl(var(--gold-dark))" }}>
              <ShieldCheck className="h-3.5 w-3.5" /> Your {planState.membership.plan_name} plan includes
            </p>
            {planIncluded.items.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {planIncluded.items.map((i) => (
                  <span key={i.id} className="rounded-full bg-white px-2.5 py-1 text-xs shadow-sm" style={{ color: "hsl(var(--navy))" }}>{i.name}</span>
                ))}
              </div>
            )}
            {planIncluded.services.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {planIncluded.services.map((s) => (
                  <span key={s.id} className="rounded-full bg-[hsl(var(--navy))]/10 px-2.5 py-1 text-xs" style={{ color: "hsl(var(--navy))" }}>{s.name}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Kurta, Thobe, Bedsheet…"
            className="w-full rounded-full steam-glass py-3.5 pl-11 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/40"
          />
        </div>

        {/* Category tabs */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <button
              key={c.slug}
              onClick={() => setActiveCat(c.name)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${activeCat === c.name ? "bg-[hsl(var(--navy))] text-white shadow-lg shadow-navy/15" : "steam-glass text-foreground/70 hover:text-navy"}`}
              style={activeCat === c.name ? { background: "hsl(var(--navy))" } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-foreground/50">
            <Package className="h-10 w-10 mx-auto opacity-40" />
            <p className="mt-3 text-sm">No items found.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                inPlan={planState.planItemIds.includes(item.id)}
                lines={lines.filter((l) => l.id === item.id)}
                onSelectService={addLine}
                onQty={changeQty}
              />
            ))}
          </div>
        )}
      </div>

      <OrderCart
        lines={lines}
        items={items}
        planState={planState}
        onQty={changeQty}
        onRemove={removeLine}
        onClear={() => setLines([])}
      />
    </div>
  );
}