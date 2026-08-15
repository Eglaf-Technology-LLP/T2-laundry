import React from "react";
import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <p className="font-mono-label text-xs" style={{ color: "hsl(var(--gold-dark))" }}>404</p>
        <h1 className="mt-3 text-4xl font-bold" style={{ color: "hsl(var(--navy))" }}>Page not found.</h1>
        <p className="mt-4 text-foreground/60">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--navy))] px-6 py-3 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
