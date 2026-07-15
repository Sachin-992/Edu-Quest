import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStableUuid(str: string): string {
  let h1 = 0, h2 = 0, h3 = 0, h4 = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = (h1 * 31 + c) | 0;
    h2 = (h2 * 37 + c) | 0;
    h3 = (h3 * 41 + c) | 0;
    h4 = (h4 * 43 + c) | 0;
  }
  
  const toHex = (n: number) => {
    return (n >>> 0).toString(16).padStart(8, '0');
  };
  
  const hex = toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
