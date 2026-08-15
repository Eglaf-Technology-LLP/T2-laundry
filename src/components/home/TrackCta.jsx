import React from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import Reveal from "@/components/home/Reveal";

export default function TrackCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] gold-border p-10 sm:p-14 text-center text-white shadow-2xl shadow-navy/20">
          <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #0E2346 0%, #0F172A 55%, #0E2346 100%)" }} />
          <div className="absolute -top-24 left-1/4 -z-10 h-64 w-64 rounded-full bg-[hsl(var(--gold))]/15 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 -z-10 h-64 w-64 rounded-full bg-[hsl(var(--cerulean))]/15 blur-3xl" />

          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-mono-label text-[hsl(var(--gold-light))]">
            <Sparkles className="h-3.5 w-3.5" /> Real-Time Tracking
          </div>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold">Already placed an order?</h2>
          <p className="mt-3 text-white/65 max-w-lg mx-auto">Track your garment from pickup to quality check to delivery in real time.</p>
          <Link
            to="/track"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold shimmer-gold transition-transform hover:scale-[1.03]"
            style={{ color: "hsl(var(--navy))" }}
          >
            <Search className="h-4 w-4" style={{ color: "hsl(var(--gold-dark))" }} /> Track My Order
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
