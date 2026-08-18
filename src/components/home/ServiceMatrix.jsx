import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Droplets, Wind, WashingMachine, Sparkles, Footprints, Home, ArrowUpRight } from "lucide-react";
import { api } from "@/api/client";
import Reveal from "@/components/home/Reveal";

const ICONS = { Droplets, Wind, WashingMachine, Sparkles, Footprints, Home };

export default function ServiceMatrix() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.entities.Service.list("name", 20)
      .then(setServices)
      .catch(() => setServices([]));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="font-mono-label text-xs text-[hsl(var(--gold-dark))]" style={{ color: "hsl(var(--gold-dark))" }}>The Service Matrix</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold" style={{ color: "hsl(var(--navy))" }}>Care, for every fabric.</h2>
        </div>
        <Link to="/services" className="group inline-flex items-center gap-1 text-sm font-semibold text-navy hover:gap-2 transition-all" style={{ color: "hsl(var(--navy))" }}>
          Explore all services <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => {
          const Icon = ICONS[s.icon] || Sparkles;
          return (
            <Reveal key={s.id} delay={i * 0.08}>
              <div className="group relative rounded-3xl steam-glass p-6 h-full shadow-sm hover:shadow-xl hover:shadow-navy/5 transition-all duration-500 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[hsl(var(--navy))]/5 text-navy transition-colors group-hover:bg-[hsl(var(--navy))] group-hover:text-white" style={{ color: "hsl(var(--navy))" }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-mono-label text-xs text-foreground/40">{s.turnaround_hours}h</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold" style={{ color: "hsl(var(--navy))" }}>{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/60">{s.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "hsl(var(--gold-dark))" }}>from {s.base_price} {s.currency || "QAR"}</span>
                  <Link to="/services" className="text-xs font-mono-label text-navy opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--navy))" }}>Book →</Link>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}