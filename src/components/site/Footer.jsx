import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="relative mt-24 bg-[hsl(var(--navy))] text-white overflow-hidden">
      <div className="absolute -top-32 right-0 h-64 w-64 rounded-full bg-[hsl(var(--gold))]/10 blur-3xl" />
      <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[hsl(var(--cerulean))]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white/95 p-5 inline-block">
              <Logo size="md" variant="mark" />
            </div>
            <p className="mt-6 max-w-md text-white/70 leading-relaxed">
              T2 Laundry redefines garment care as a concierge experience — the premier guardian of the Middle East's wardrobe. Wash, iron, dry clean and specialty care with free pickup & delivery.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-[hsl(var(--gold))]/30 transition-colors" aria-label="social">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono-label text-[hsl(var(--gold-light))] text-xs mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/services" className="hover:text-white">Wash &amp; Fold</Link></li>
              <li><Link to="/services" className="hover:text-white">Iron &amp; Press</Link></li>
              <li><Link to="/services" className="hover:text-white">Dry Clean</Link></li>
              <li><Link to="/services" className="hover:text-white">Footwear Care</Link></li>
              <li><Link to="/services" className="hover:text-white">Home &amp; Carpet</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono-label text-[hsl(var(--gold-light))] text-xs mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[hsl(var(--gold-light))]" /> +974 4000 0000</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[hsl(var(--gold-light))]" /> care@t2laundry.com</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-[hsl(var(--gold-light))] mt-0.5" /> Doha, Qatar &middot; Serving the GCC</li>
            </ul>
            <Link to="/subscription" className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[hsl(var(--navy))] shimmer-gold" style={{ background: "linear-gradient(135deg, #A68336, #E5C578)" }}>
              Membership Plans
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
          <p>© {new Date().getFullYear()} T2 Laundry. Time &amp; Trust. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}