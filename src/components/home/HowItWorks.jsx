import React from "react";
import { Truck, ClipboardList, Sparkles, PackageCheck } from "lucide-react";
import Reveal from "@/components/home/Reveal";

const STEPS = [
  { icon: ClipboardList, title: "Choose your service", desc: "Select items & care type — wash, iron, dry clean or specialty." },
  { icon: Truck, title: "We pick up", desc: "Book a slot or drop at our shop. Free pickup & delivery for members." },
  { icon: Sparkles, title: "Expert care", desc: "Specialist cleaning, pressing and a quality check on every item." },
  { icon: PackageCheck, title: "Fresh delivery", desc: "Track in real-time and receive your wardrobe, immaculate." },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <div className="absolute top-1/3 left-0 -z-10 h-72 w-72 rounded-full bg-[hsl(var(--gold))]/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-80 w-80 rounded-full bg-[hsl(var(--cerulean))]/10 blur-3xl" />

      <Reveal className="text-center max-w-2xl mx-auto mb-12">
        <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>The T2 Standard</p>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold" style={{ color: "hsl(var(--navy))" }}>A transparent, four-step ritual.</h2>
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={i} delay={i * 0.1} className="relative">
            <div className="rounded-3xl steam-glass p-6 h-full shadow-sm hover:shadow-xl hover:shadow-navy/10 transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[hsl(var(--navy))] text-white shadow-md shadow-navy/20">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-heading text-3xl font-bold text-navy/10" style={{ color: "hsl(var(--navy) / 0.1)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "hsl(var(--navy))" }}>{s.title}</h3>
              <p className="mt-2 text-sm text-foreground/55 leading-relaxed">{s.desc}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-3 h-px w-6 bg-gradient-to-r from-[hsl(var(--gold))]/50 to-transparent" />
            )}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
