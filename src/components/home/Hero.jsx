import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Truck } from "lucide-react";
import { Image } from "@/components/ui/image";
import HERO_IMG from "@/assets/hero.png";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image src={HERO_IMG} alt="" className="h-full w-full object-cover" fittingType="fill" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--alabaster))] via-[hsl(var(--alabaster))]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--alabaster))] to-transparent" />
      </div>

      <motion.div
        className="mx-auto max-w-7xl px-4 sm:px-6 py-24 lg:py-36"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="max-w-2xl">
          <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full steam-glass px-4 py-2 text-xs font-mono-label text-navy shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} />
            Premium Garment Care Concierge
          </motion.div>

          <motion.h1 variants={item} className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-balance" style={{ color: "hsl(var(--navy))" }}>
            Your wardrobe,
            <br />
            <span className="gold-text">cared for like couture.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-lg leading-relaxed text-foreground/70 max-w-xl">
            From Thobes to wedding dresses, carpets to sneakers — T2 Laundry delivers immaculate wash, iron and dry-clean care with free pickup & delivery across the region.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col sm:flex-row gap-3">
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
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-6 text-sm text-foreground/60">
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} /> 24–72h turnaround</span>
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} /> Free pickup & delivery</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
