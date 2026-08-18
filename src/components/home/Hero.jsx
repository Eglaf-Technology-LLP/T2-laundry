import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, Truck, Sparkle } from "lucide-react";
import WashingMachine3D from "@/components/home/WashingMachine3D";
import ErrorBoundary from "@/components/ErrorBoundary";

// WebGL context creation can fail on older/low-memory mobile devices, in
// Safari low-power mode, or with too many GPU contexts already open —
// without this, that failure was an uncaught render error that blanked the
// entire page. This keeps the rest of the homepage intact if it happens.
function Washing3DSafe() {
  return (
    <ErrorBoundary
      fallback={
        <div className="h-full w-full grid place-items-center bg-gradient-to-br from-[hsl(var(--navy))] to-[#1a3a6b]">
          <Sparkle className="h-10 w-10 text-[hsl(var(--gold-light))]" />
        </div>
      }
    >
      <WashingMachine3D />
    </ErrorBoundary>
  );
}

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
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-[hsl(var(--alabaster))] to-white" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[hsl(var(--alabaster))] via-[hsl(var(--alabaster))]/70 to-transparent" />
      <div className="absolute top-1/4 right-[10%] -z-10 h-72 w-72 rounded-full bg-[hsl(var(--gold))]/10 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-[hsl(var(--cerulean))]/10 blur-3xl" />

      {/* Desktop: 3D washing machine fills the right half of the hero */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-1/2 xl:w-[55%]">
        <Washing3DSafe />
      </div>

      <motion.div
        className="relative mx-auto max-w-7xl px-4 sm:px-6 py-24 lg:py-36"
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
              Membership Plans — from 109 QAR
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-wrap gap-6 text-sm text-foreground/60">
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} /> 24–72h turnaround</span>
            <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-[hsl(var(--gold))]" style={{ color: "hsl(var(--gold))" }} /> Free pickup & delivery</span>
          </motion.div>
        </div>

        {/* Mobile/tablet: 3D washing machine shown in-flow below the text */}
        <motion.div variants={item} className="lg:hidden relative mt-12 h-72 sm:h-96 rounded-3xl overflow-hidden steam-glass">
          <Washing3DSafe />
        </motion.div>
      </motion.div>
    </section>
  );
}
