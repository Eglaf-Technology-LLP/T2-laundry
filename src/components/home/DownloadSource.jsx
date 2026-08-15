import React, { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { createZip, fileFromString } from "@/lib/zip";

// Raw imports of the actual project source — the zip always reflects the live files.
import indexHtml from "/index.html?raw";
import packageJson from "/package.json?raw";
import viteConfig from "/vite.config.js?raw";
import tailwindConfig from "/tailwind.config.js?raw";

import mainJsx from "@/main.jsx?raw";
import indexCss from "@/index.css?raw";
import appJsx from "@/App.jsx?raw";
import base44Client from "@/api/base44Client.js?raw";
import utilsJs from "@/lib/utils.js?raw";

import siteLayout from "@/components/site/SiteLayout.jsx?raw";
import navbar from "@/components/site/Navbar.jsx?raw";
import footer from "@/components/site/Footer.jsx?raw";
import logo from "@/components/site/Logo.jsx?raw";

import homePage from "@/pages/Home.jsx?raw";
import hero from "@/components/home/Hero.jsx?raw";
import serviceMatrix from "@/components/home/ServiceMatrix.jsx?raw";
import garmentCategories from "@/components/home/GarmentCategories.jsx?raw";
import vipVault from "@/components/home/VIPVault.jsx?raw";
import howItWorks from "@/components/home/HowItWorks.jsx?raw";
import trackCta from "@/components/home/TrackCta.jsx?raw";
import downloadSource from "@/components/home/DownloadSource.jsx?raw";

import services from "@/pages/Services.jsx?raw";
import itemCard from "@/components/services/ItemCard.jsx?raw";
import orderCart from "@/components/services/OrderCart.jsx?raw";

import trackOrder from "@/pages/TrackOrder.jsx?raw";
import subscription from "@/pages/Subscription.jsx?raw";

import adminLayout from "@/components/admin/AdminLayout.jsx?raw";
import adminDashboard from "@/pages/admin/AdminDashboard.jsx?raw";
import adminOrders from "@/pages/admin/AdminOrders.jsx?raw";
import adminItems from "@/pages/admin/AdminItems.jsx?raw";
import adminMembers from "@/pages/admin/AdminMembers.jsx?raw";

import sqlScript from "@/data/t2-laundry-schema.sql?raw";

const P = "t2-laundry/";
const FILES = [
  ["index.html", indexHtml],
  ["package.json", packageJson],
  ["vite.config.js", viteConfig],
  ["tailwind.config.js", tailwindConfig],
  ["database.sql", sqlScript],
  ["src/main.jsx", mainJsx],
  ["src/index.css", indexCss],
  ["src/App.jsx", appJsx],
  ["src/api/base44Client.js", base44Client],
  ["src/lib/utils.js", utilsJs],
  ["src/components/site/SiteLayout.jsx", siteLayout],
  ["src/components/site/Navbar.jsx", navbar],
  ["src/components/site/Footer.jsx", footer],
  ["src/components/site/Logo.jsx", logo],
  ["src/pages/Home.jsx", homePage],
  ["src/components/home/Hero.jsx", hero],
  ["src/components/home/ServiceMatrix.jsx", serviceMatrix],
  ["src/components/home/GarmentCategories.jsx", garmentCategories],
  ["src/components/home/VIPVault.jsx", vipVault],
  ["src/components/home/HowItWorks.jsx", howItWorks],
  ["src/components/home/TrackCta.jsx", trackCta],
  ["src/components/home/DownloadSource.jsx", downloadSource],
  ["src/pages/Services.jsx", services],
  ["src/components/services/ItemCard.jsx", itemCard],
  ["src/components/services/OrderCart.jsx", orderCart],
  ["src/pages/TrackOrder.jsx", trackOrder],
  ["src/pages/Subscription.jsx", subscription],
  ["src/components/admin/AdminLayout.jsx", adminLayout],
  ["src/pages/admin/AdminDashboard.jsx", adminDashboard],
  ["src/pages/admin/AdminOrders.jsx", adminOrders],
  ["src/pages/admin/AdminItems.jsx", adminItems],
  ["src/pages/admin/AdminMembers.jsx", adminMembers],
];

const README = `T2 LAUNDRY — Full Source Code
"Time & Trust" | Premium Garment Care Concierge
Stack: React 18 + Vite + Tailwind CSS + Base44 SDK

CONTENTS
  index.html, package.json, vite.config.js, tailwind.config.js .... project config
  database.sql ..................................................... MySQL schema + seed data
  src/ .............................................................. full application source
    App.jsx, main.jsx, index.css ................................. entry & styles
    api/base44Client.js, lib/utils.js ........................... SDK + helpers
    components/site/  (Navbar, Footer, Logo, SiteLayout)
    components/home/  (Hero, ServiceMatrix, GarmentCategories, VIPVault, ...)
    components/services/ (ItemCard, OrderCart)
    components/admin/ (AdminLayout)
    pages/  (Home, Services, Subscription, TrackOrder)
    pages/admin/ (AdminDashboard, AdminOrders, AdminItems, AdminMembers)

HOW TO RUN
  1. Create a Vite + React project, drop these files in (keep the folder structure).
  2. npm install  (dependencies listed in package.json)
  3. npm run dev
  4. To recreate the database:  mysql -u root -p < database.sql

NOTE: Generic shadcn/ui components (src/components/ui/*) and standard platform
scaffolding are open-source boilerplate and are not included.

Generated: 2026-08-15
`;

export default function DownloadSource() {
  const [done, setDone] = useState(false);

  const download = () => {
    const files = [
      fileFromString(`${P}README.txt`, README),
      ...FILES.map(([path, content]) => fileFromString(`${P}${path}`, content)),
    ];
    const blob = createZip(files);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "t2-laundry-source.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="relative overflow-hidden rounded-[2rem] steam-glass p-10 sm:p-14 text-center shadow-sm">
        <div className="absolute -top-16 right-10 h-56 w-56 rounded-full bg-[hsl(var(--gold))]/10 blur-3xl" />
        <div className="relative">
          <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>Open Source</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--navy))" }}>
            Download this project.
          </h2>
          <p className="mt-3 text-foreground/60 max-w-lg mx-auto">
            Get the complete source code (React + Tailwind) and a ready-to-run SQL script — zipped with the full project structure.
          </p>
          <button
            onClick={download}
            className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-navy/15 transition-transform hover:scale-[1.03] active:scale-95"
            style={{ background: "hsl(var(--navy))" }}
          >
            {done ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--gold-light))]" /> Downloaded
              </>
            ) : (
              <>
                <Download className="h-4 w-4 text-[hsl(var(--gold-light))]" /> Download Source (.zip) + SQL
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-foreground/40">.zip archive · full project structure + database.sql</p>
        </div>
      </div>
    </section>
  );
}