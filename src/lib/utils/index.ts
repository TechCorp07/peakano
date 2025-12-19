import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * This handles Tailwind class conflicts intelligently
 * 
 * Example:
 * cn("px-4 py-2", "px-6") => "py-2 px-6" (px-6 wins)
 * cn("text-red-500", condition && "text-blue-500") => handles conditionals
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
