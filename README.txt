T2 LAUNDRY — Full Source Code
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
