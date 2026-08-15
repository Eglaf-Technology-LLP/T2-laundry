import React from "react";
import { cn } from "@/lib/utils";

const FIT_CLASS = { fill: "object-cover", contain: "object-contain" };

export function Image({ src, alt = "", className, fittingType, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(FIT_CLASS[fittingType], className)}
      {...props}
    />
  );
}
