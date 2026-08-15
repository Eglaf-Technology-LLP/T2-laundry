import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Package, Users, Crown, Home, Menu, X, LogOut } from "lucide-react";
import Logo from "@/components/site/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { label: "Overview", to: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Orders", to: "/admin/orders", icon: ClipboardList },
  { label: "Items & Categories", to: "/admin/items", icon: Package },
  { label: "Members", to: "/admin/members", icon: Users },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname.startsWith(to);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <Logo size="sm" variant="full" />
      </div>
      <div className="px-4 pt-6">
        <p className="px-3 font-mono-label text-[10px] text-sidebar-foreground/40">Command Center</p>
        <nav className="mt-3 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive(n.to, n.exact) ? "bg-[hsl(var(--navy))] text-white shadow-md" : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
              )}
              style={isActive(n.to, n.exact) ? { background: "hsl(var(--navy))", color: "white" } : {}}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div className="relative rounded-2xl gold-border p-4 text-white">
          <div className="absolute inset-0 -z-10 rounded-2xl" style={{ background: "linear-gradient(135deg, #0E2346, #0F172A)" }} />
          <Crown className="h-5 w-5 text-[hsl(var(--gold-light))]" />
          <p className="mt-2 text-sm font-semibold">T2 VIP Program</p>
          <p className="mt-1 text-xs text-white/60">{NAV.length} active modules</p>
          <Link to="/subscription" className="mt-3 inline-block text-xs font-mono-label text-[hsl(var(--gold-light))]">View plans →</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[hsl(var(--alabaster))]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar shadow-2xl">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-white/80 backdrop-blur px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden grid h-10 w-10 place-items-center rounded-xl hover:bg-muted"><Menu className="h-5 w-5" /></button>
            <div>
              <p className="font-mono-label text-[10px] text-foreground/40">T2 Command Center</p>
              <h1 className="text-lg font-bold" style={{ color: "hsl(var(--navy))" }}>{NAV.find((n) => isActive(n.to, n.exact))?.label || "Dashboard"}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">View Site</span>
            </Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium hover:bg-accent">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}