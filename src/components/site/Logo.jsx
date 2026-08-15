import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import LOGO_URL from "@/assets/logo.jpg";

export default function Logo({ className, variant = "full", size = "md" }) {
  const heights = { sm: "h-9", md: "h-12", lg: "h-16" };
  const wordSize = { sm: "text-sm", md: "text-base", lg: "text-xl" };
  const tagSize = { sm: "text-[8px]", md: "text-[10px]", lg: "text-xs" };

  if (variant === "mark") {
    return <img src={LOGO_URL} alt="T2 Laundry" className={cn(heights[size], "w-auto object-contain", className)} />;
  }

  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)}>
      <img src={LOGO_URL} alt="T2 Laundry" className={cn(heights[size], "w-auto object-contain shrink-0")} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading font-bold tracking-[0.22em] text-navy uppercase", wordSize[size])} style={{ color: "hsl(var(--navy))" }}>
          T2 Laundry
        </span>
        <span className={cn("font-mono uppercase tracking-[0.4em] mt-1 gold-text", tagSize[size])}>
          Time &amp; Trust
        </span>
      </span>
    </Link>
  );
}