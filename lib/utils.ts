import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try { return format(parseISO(dateStr), "dd MMM yyyy"); } catch { return dateStr; }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try { return format(parseISO(dateStr), "dd MMM yyyy, hh:mm a"); } catch { return dateStr; }
}

export function nightsBetween(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;
  try { return Math.max(differenceInDays(parseISO(checkOut), parseISO(checkIn)), 0); }
  catch { return 0; }
}

export function gstRate(ratePerNight: number): number {
  if (ratePerNight <= 1000) return 0;
  if (ratePerNight <= 7500) return 12;
  return 18;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    checked_in:   "bg-blue-50 text-blue-700 border-blue-200",
    checked_out:  "bg-gray-50 text-gray-700 border-gray-200",
    cancelled:    "bg-red-50 text-red-700 border-red-200",
    pending:      "bg-amber-50 text-amber-700 border-amber-200",
    no_show:      "bg-orange-50 text-orange-700 border-orange-200",
  };
  return map[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

export function getRoomStatusColor(status: string): string {
  const map: Record<string, string> = {
    available:  "bg-emerald-500",
    occupied:   "bg-red-500",
    cleaning:   "bg-amber-500",
    maintenance:"bg-orange-500",
    blocked:    "bg-gray-500",
    inspecting: "bg-blue-500",
  };
  return map[status] ?? "bg-gray-400";
}

export function starArray(n: number): number[] {
  return Array.from({ length: 5 }, (_, i) => i < n ? 1 : 0);
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function mealPlanLabel(plan?: string | null): string {
  if (!plan) return "—";
  const map: Record<string, string> = {
    ep:  "Room Only",
    cp:  "Breakfast Included",
    map: "Half Board (2 meals)",
    ap:  "Full Board (3 meals)",
    ai:  "All Inclusive",
  };
  return map[plan.toLowerCase()] ?? plan.toUpperCase();
}

export function sourceLabel(source?: string | null): string {
  if (!source) return "—";
  const map: Record<string, string> = {
    online_web: "Website",
    online_app: "Mobile App",
    walk_in:    "Walk-in",
    phone:      "Phone",
    ota:        "OTA",
    corporate:  "Corporate",
  };
  return map[source] ?? source.replace(/_/g, " ");
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

export const POPULAR_CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Kolkata",
  "Jaipur","Agra","Goa","Varanasi","Pune","Ahmedabad",
  "Udaipur","Shimla","Manali","Darjeeling","Kochi","Mysuru",
];