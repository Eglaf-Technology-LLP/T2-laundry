import React from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export default function TrackCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <div className="relative overflow-hidden rounded-[2rem] steam-glass p-10 sm:p-14 text-center shadow-sm">
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--navy))" }}>Already placed an order?</h2>
        <p className="mt-3 text-foreground/60 max-w-lg mx-auto">Track your garment from pickup to quality check to delivery in real time.</p>
        <Link to="/track" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--navy))] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-navy/15 transition-transform hover:scale-[1.03]">
          <Search className="h-4 w-4 text-[hsl(var(--gold-light))]" /> Track My Order
        </Link>
      </div>
    </section>
  );
}