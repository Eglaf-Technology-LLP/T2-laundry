import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Where to send the user after login/signup, preserving both the return path
// (?next=) and any in-flight intent (?plan=) so e.g. "subscribe to a plan"
// survives the signup detour instead of silently dropping on the floor.
export function nextDestination(searchParams) {
  const next = searchParams.get("next") || "/subscription";
  const plan = searchParams.get("plan");
  if (!plan) return next;
  return `${next}${next.includes("?") ? "&" : "?"}plan=${plan}`;
}
