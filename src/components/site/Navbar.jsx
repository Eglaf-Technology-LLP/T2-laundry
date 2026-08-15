import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Services", to: "/services" },
  { label: "Subscription", to: "/subscription" },
  { label: "Track Order", to: "/track" },
  { label: "Admin", to: "/admin" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50 transition-all duration-500", scrolled ? "py-2" : "py-4")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className={cn("flex items-center justify-between rounded-2xl px-4 sm:px-6 transition-all duration-500", scrolled ? "steam-glass shadow-lg shadow-navy/5 py-2.5" : "py-2")}>
          <Logo size="sm" />

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  location.pathname === l.to ? "text-navy" : "text-foreground/70 hover:text-navy"
                )}
                style={location.pathname === l.to ? { color: "hsl(var(--navy))" } : {}}
              >
                {l.label}
                {location.pathname === l.to && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-[hsl(var(--gold))]" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/services"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[hsl(var(--navy))] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy/10 transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: "hsl(var(--navy))" }}
            >
              <Sparkles className="h-4 w-4 text-[hsl(var(--gold-light))]" />
              Book a Pickup
            </Link>
            <button
              className="md:hidden grid place-items-center h-10 w-10 rounded-full steam-glass"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden overflow-hidden transition-all duration-300 mx-4 sm:mx-6", open ? "max-h-96 mt-2" : "max-h-0")}>
        <div className="steam-glass rounded-2xl p-4 shadow-xl">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/60">
                {l.label}
              </Link>
            ))}
            <Link to="/services" className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-3 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-[hsl(var(--gold-light))]" /> Book a Pickup
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}