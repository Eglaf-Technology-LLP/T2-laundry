import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles, User, LogOut } from "lucide-react";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const NAV_LINKS = [
  { label: "Services", to: "/services" },
  { label: "Subscription", to: "/subscription" },
  { label: "Track Order", to: "/track" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-navy"
                >
                  <User className="h-4 w-4" /> My Account
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                  className="hidden sm:grid place-items-center h-10 w-10 rounded-full text-foreground/50 hover:text-navy hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground/70 hover:text-navy"
              >
                <User className="h-4 w-4" /> Log in
              </Link>
            )}
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

      {/* Mobile menu — full-height drawer sliding in from the right. Nav
          links + account row sit in a centered flex-1 block sized to fit
          without scrolling; Book a Pickup stays pinned to the bottom. */}
      <div className={cn("md:hidden fixed inset-0 z-50", open ? "visible" : "invisible")}>
        <div
          className={cn("absolute inset-0 bg-navy/40 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[82%] max-w-xs bg-white shadow-2xl flex flex-col transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <Logo size="sm" />
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col justify-center gap-1 px-6 min-h-0">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-3 text-2xl font-semibold transition-colors"
                style={location.pathname === l.to ? { color: "hsl(var(--navy))" } : { color: "hsl(var(--foreground))" }}
              >
                {l.label}
              </Link>
            ))}

            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-1">
              {isAuthenticated ? (
                <>
                  <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2.5 text-base font-medium text-foreground/70">
                    <User className="h-4 w-4" /> My Account
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 py-2.5 text-base font-medium text-foreground/70 text-left">
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 py-2.5 text-base font-medium text-foreground/70">
                  <User className="h-4 w-4" /> Log in
                </Link>
              )}
            </div>
          </nav>

          <div className="shrink-0 p-5 border-t border-border">
            <Link
              to="/services"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-3.5 text-sm font-semibold text-white"
              style={{ background: "hsl(var(--navy))" }}
            >
              <Sparkles className="h-4 w-4 text-[hsl(var(--gold-light))]" /> Book a Pickup
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
