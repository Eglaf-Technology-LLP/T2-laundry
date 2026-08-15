import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Clock, Truck } from "lucide-react";
import { Image } from "@/components/ui/image";

const HERO_IMG = "https://media.base44.com/images/public/6a803b0dcd51fca903469d5f/46551ef1e_generated_6a8d0c49.png";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image src={HERO_IMG} alt="" className="h-full w-full object-cover" fittingType="fill" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--alabaster))] via-[hsl(var(--alabaster))]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--alabaster))] to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-24 lg:py-36">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full steam-glass px-4 py-2 text-xs font-mono-label text-navy shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} />
            Premium Garment Care Concierge
          </div>

          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-balance" style={{ color: "hsl(var(--navy))" }}>
            Your wardrobe,
            <br />
            <span className="gold-text">cared for like couture.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-foreground/70 max-w-xl">
            From Thobes to wedding dresses, carpets to sneakers — T2 Laundry delivers immaculate wash, iron and dry-clean care with free pickup & delivery across the region.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/services"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--navy))] px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-navy/15 transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: "hsl(var(--navy))" }}
            >
              Book a Pickup
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/subscription"
              className="inline-flex items-center justify-center gap-2 rounded-full gold-border shimmer-gold px-7 py-4 text-sm font-semibold text-white"
            >
              Join T2 VIP — 109 QAR
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-foreground/60">
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} /> 24–72h turnaround</span>
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} /> Free pickup & delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
}