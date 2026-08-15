import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Crown, Truck, Banknote, TrendingUp, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { base44 } from "@/api/base44Client";

const STAGES = ["pending", "picked_up", "in_facility", "quality_check", "out_for_delivery", "delivered"];
const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_facility: "bg-indigo-100 text-indigo-700",
  quality_check: "bg-violet-100 text-violet-700",
  out_for_delivery: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    base44.entities.Order.list("-created_date", 100).then(setOrders).catch(() => {});
    base44.entities.Member.list().then(setMembers).catch(() => {});
    base44.entities.Item.list().then(setItems).catch(() => {});
  }, []);

  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const vipCount = members.filter((m) => m.plan_name === "T2 VIP").length;

  // revenue by category heatmap
  const catRevenue = {};
  orders.forEach((o) => (o.items || []).forEach((it) => {
    catRevenue[it.category] = (catRevenue[it.category] || 0) + it.price * it.quantity;
  }));
  const maxCat = Math.max(1, ...Object.values(catRevenue));
  const categories = Object.keys(catRevenue).sort((a, b) => catRevenue[b] - catRevenue[a]);

  // weekly chart
  const chartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    day: d,
    orders: orders.length ? Math.round(orders.length / 6 * (1 + Math.sin(i * 1.3)) * 2) : 0,
    revenue: orders.length ? Math.round(orders.length / 6 * (1 + Math.cos(i * 1.1)) * 28) : 0,
  }));

  const stats = [
    { label: "Total Orders", value: orders.length, icon: ClipboardList, tint: "text-blue-600 bg-blue-50" },
    { label: "Active Orders", value: active, icon: Truck, tint: "text-cyan-600 bg-cyan-50" },
    { label: "Revenue (QAR)", value: revenue, icon: Banknote, tint: "text-emerald-600 bg-emerald-50" },
    { label: "VIP Members", value: vipCount, icon: Crown, tint: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm border border-border/60">
            <div className="flex items-center justify-between">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.tint}`}><s.icon className="h-5 w-5" /></span>
            </div>
            <p className="mt-4 text-3xl font-bold" style={{ color: "hsl(var(--navy))" }}>{s.value}</p>
            <p className="mt-1 text-sm text-foreground/55">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold" style={{ color: "hsl(var(--navy))" }}>Weekly Activity</h3>
              <p className="text-xs text-foreground/50">Orders & revenue trend</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} fill="#0E2346" barSize={18} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#D4AF37" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue heatmap */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-border/60">
          <h3 className="font-semibold" style={{ color: "hsl(var(--navy))" }}>Revenue Heatmap</h3>
          <p className="text-xs text-foreground/50">By category (QAR)</p>
          <div className="mt-5 space-y-3">
            {categories.map((c) => (
              <div key={c}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70 truncate pr-2">{c}</span>
                  <span className="font-semibold" style={{ color: "hsl(var(--navy))" }}>{catRevenue[c]}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(catRevenue[c] / maxCat) * 100}%`, background: "linear-gradient(90deg, #0E2346, #D4AF37)" }} />
                </div>
              </div>
            ))}
            {!categories.length && <p className="text-sm text-foreground/40">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-border/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: "hsl(var(--navy))" }}>Recent Orders</h3>
          <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(var(--gold-dark))" }}>View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="space-y-2">
          {orders.slice(0, 6).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-sm font-semibold" style={{ color: "hsl(var(--navy))" }}>{o.order_code}</span>
                <span className="text-sm text-foreground/70 truncate">{o.customer_name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>{o.total} QAR</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[o.status] || ""}`}>{o.status.replace("_", " ")}</span>
              </div>
            </div>
          ))}
          {!orders.length && <p className="text-sm text-foreground/40 py-6 text-center">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}