import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shirt, Layers, Home as HomeIcon, Footprints, Crown, ArrowRight } from "lucide-react";
import { api } from "@/api/client";
import Reveal from "@/components/home/Reveal";

const ICONS = { Shirt, Layers, Home: HomeIcon, Footprints, Crown };

export default function GarmentCategories() {
  const [cats, setCats] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.entities.Category.list("display_order", 20)
      .then(setCats)
      .catch(() => setCats([]));
    api.entities.Item.list().then((items) => {
      const c = {};
      items.forEach((i) => { c[i.category] = (c[i.category] || 0) + 1; });
      setCounts(c);
    }).catch(() => {});
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
      <Reveal className="text-center max-w-2xl mx-auto mb-12">
        <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>The Garment Matrix</p>
        <h2 className="mt-3 text-4xl sm:text-5xl font-bold" style={{ color: "hsl(var(--navy))" }}>Built for the Middle East wardrobe.</h2>
        <p className="mt-4 text-foreground/60">From Thobes and Jalabiyas to carpets, rugs and wedding dresses — every category, handled with specialist care.</p>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => {
          const Icon = ICONS[c.icon] || Shirt;
          return (
            <Reveal key={c.id} delay={i * 0.08}>
              <Link
                to="/services"
                className="group relative overflow-hidden rounded-3xl steam-glass p-7 shadow-sm hover:shadow-xl hover:shadow-navy/5 transition-all duration-500 hover:-translate-y-1 block"
              >
                <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[hsl(var(--gold))]/5 blur-2xl group-hover:bg-[hsl(var(--gold))]/15 transition-colors" />
                <div className="relative">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: "hsl(var(--navy))" }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold" style={{ color: "hsl(var(--navy))" }}>{c.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/55 line-clamp-2">{c.description}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-mono-label text-xs text-foreground/40">{counts[c.name] || 0} items</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--gold-dark))" }}>
                      Browse <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}