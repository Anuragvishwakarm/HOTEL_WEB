"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Star, MapPin, Wifi, Coffee, Car, Dumbbell, Waves,
  UtensilsCrossed, Heart, ChevronDown, ChevronUp,
  SlidersHorizontal, X, Check, ArrowUpDown, Grid3X3, List,
} from "lucide-react";
import Link from "next/link";
import { hotelsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Hotel } from "@/lib/types";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Skeleton } from "@/components/ui/Skeleton";

// ── helpers ───────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
function offsetDate(days: number) {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function fmtShort(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
}
function nights(ci: string, co: string) {
  return Math.max(0, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000));
}

// ── Filter sections ───────────────────────────────────────────────────────────
interface FilterSection {
  id: string;
  title: string;
  options: { label: string; key: string; count?: number }[];
}

const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "popular",
    title: "Popular filters",
    options: [
      { label: "5 stars",           key: "stars_5",       count: 3    },
      { label: "No prepayment",      key: "no_prepayment", count: 953  },
      { label: "Very good: 8+",      key: "very_good",     count: 260  },
      { label: "Breakfast included", key: "breakfast",     count: 435  },
      { label: "Free cancellation",  key: "free_cancel",   count: 776  },
      { label: "Free WiFi",          key: "free_wifi",     count: 1122 },
      { label: "Swimming pool",      key: "pool",          count: 5    },
    ],
  },
  {
    id: "meals",
    title: "Meals",
    options: [
      { label: "Self catering",               key: "ep",    count: 186 },
      { label: "Breakfast included",          key: "cp",    count: 435 },
      { label: "All meals included",          key: "ap",    count: 20  },
      { label: "All-inclusive",               key: "ai",    count: 5   },
      { label: "Breakfast & dinner included", key: "map",   count: 48  },
    ],
  },
  {
    id: "stars",
    title: "Property rating",
    options: [
      { label: "1 star",  key: "star_1", count: 2   },
      { label: "2 stars", key: "star_2", count: 60  },
      { label: "3 stars", key: "star_3", count: 685 },
      { label: "4 stars", key: "star_4", count: 291 },
      { label: "5 stars", key: "star_5", count: 3   },
    ],
  },
  {
    id: "facilities",
    title: "Facilities",
    options: [
      { label: "Parking",            key: "parking",     count: 747  },
      { label: "Restaurant",         key: "restaurant",  count: 341  },
      { label: "Room service",       key: "room_svc",    count: 1052 },
      { label: "24-hr front desk",   key: "front_desk",  count: 1043 },
      { label: "Fitness centre",     key: "gym",         count: 56   },
      { label: "Swimming pool",      key: "pool_f",      count: 5    },
      { label: "Spa",                key: "spa",         count: 18   },
    ],
  },
  {
    id: "room_facilities",
    title: "Room facilities",
    options: [
      { label: "Air conditioning",    key: "ac",       count: 1224 },
      { label: "Balcony",             key: "balcony",  count: 330  },
      { label: "Kitchen/kitchenette", key: "kitchen",  count: 186  },
      { label: "Sea view",            key: "sea_view", count: 18   },
      { label: "Private pool",        key: "priv_pool",count: 6    },
    ],
  },
  {
    id: "review",
    title: "Review score",
    options: [
      { label: "Superb: 9+",    key: "rev_9", count: 95  },
      { label: "Very good: 8+", key: "rev_8", count: 260 },
      { label: "Good: 7+",      key: "rev_7", count: 500 },
      { label: "Pleasant: 6+",  key: "rev_6", count: 651 },
    ],
  },
  {
    id: "policy",
    title: "Reservation policy",
    options: [
      { label: "Free cancellation",         key: "free_cancel2",  count: 776 },
      { label: "Book without credit card",  key: "no_cc",         count: 840 },
      { label: "No prepayment",             key: "no_prepay2",    count: 953 },
    ],
  },
];

// ── Collapsible section ───────────────────────────────────────────────────────
function FilterBlock({ section, checked, onToggle }: {
  section: FilterSection;
  checked: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showAll,  setShowAll]  = useState(false);
  const visible = showAll ? section.options : section.options.slice(0, 5);

  return (
    <div className="py-4 border-b border-surface-100 last:border-0">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-between w-full mb-0"
      >
        <span className="font-semibold text-sm text-navy-900">{section.title}</span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-surface-400" />
          : <ChevronDown className="w-4 h-4 text-surface-400" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {visible.map(opt => (
            <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                onClick={() => onToggle(opt.key)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0
                  ${checked.has(opt.key)
                    ? "bg-[#0071c2] border-[#0071c2]"
                    : "border-surface-300 group-hover:border-[#0071c2]"}`}
              >
                {checked.has(opt.key) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              <span className="text-sm text-navy-900 flex-1">{opt.label}</span>
              {opt.count !== undefined && (
                <span className="text-xs text-surface-400">{opt.count.toLocaleString()}</span>
              )}
            </label>
          ))}
          {section.options.length > 5 && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-xs text-[#0071c2] hover:underline mt-1 flex items-center gap-1"
            >
              {showAll
                ? <><ChevronUp className="w-3 h-3" /> Show less</>
                : <><ChevronDown className="w-3 h-3" /> Show all {section.options.length}</>}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hotel result card (Booking.com list style) ────────────────────────────────
function HotelResultCard({ hotel, checkIn, checkOut, adults }: {
  hotel: Hotel; checkIn: string; checkOut: string; adults: number;
}) {
  const [saved, setSaved] = useState(false);
  const n = checkIn && checkOut ? nights(checkIn, checkOut) : 1;
  const PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=260&fit=crop&auto=format";

  // Use real min_price from API, fallback to estimate if not yet loaded
  const basePrice = hotel.min_price ?? (2499 + hotel.id * 500);
  const total     = basePrice * n;

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative sm:w-48 lg:w-56 shrink-0">
        <img
          src={hotel.cover_photo_url || PLACEHOLDER}
          alt={hotel.name}
          className="w-full h-48 sm:h-full object-cover"
        />
        <button
          onClick={() => setSaved(v => !v)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-surface-400"}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row flex-1 p-4 gap-4">
        {/* Hotel info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <Link href={`/guest/hotel/${hotel.id}`} className="font-bold text-[#0071c2] hover:underline text-base leading-tight">
              {hotel.name}
            </Link>
            {hotel.is_verified && (
              <span className="text-[10px] font-bold bg-blue-100 text-[#0071c2] px-1.5 py-0.5 rounded">Verified</span>
            )}
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: hotel.star_rating }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
            ))}
          </div>

          {/* Location */}
          <p className="text-xs text-[#0071c2] hover:underline cursor-pointer flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" /> {hotel.city}, {hotel.state}
          </p>

          {/* Amenity chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(hotel.amenities || []).slice(0, 4).map(a => (
              <span key={a} className="text-[11px] text-emerald-700 flex items-center gap-0.5">
                <Check className="w-3 h-3" /> {a}
              </span>
            ))}
          </div>

          {/* Dates badge */}
          {checkIn && checkOut && (
            <div className="inline-flex items-center gap-1.5 bg-surface-50 border border-surface-200 rounded-lg px-2.5 py-1.5 text-xs text-navy-900">
              <span>{fmtShort(checkIn)} – {fmtShort(checkOut)}</span>
              <span className="text-surface-400">·</span>
              <span>{n} night{n !== 1 ? "s" : ""}, {adults} adult{adults !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Perks */}
          <div className="mt-2 space-y-0.5">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Free cancellation
            </p>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> No prepayment needed
            </p>
          </div>
        </div>

        {/* Review + Price */}
        <div className="sm:w-36 flex flex-col items-end justify-between shrink-0 text-right">
          {/* Review score */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold text-navy-900">Very good</p>
              <p className="text-xs text-surface-400">124 reviews</p>
            </div>
            <div className="w-9 h-9 bg-[#003580] text-white text-sm font-bold rounded-tl-lg rounded-tr-lg rounded-br-lg flex items-center justify-center">
              8.2
            </div>
          </div>

          {/* Price */}
          <div className="mt-3">
            {n > 1 && (
              <p className="text-xs text-surface-400 mb-0.5">{n} nights, {adults} adults</p>
            )}
            <p className="font-bold text-lg text-navy-900">{formatCurrency(total)}</p>
            <p className="text-[11px] text-surface-400">+taxes & charges</p>
            <Link
              href={`/guest/hotel/${hotel.id}`}
              className="mt-2 block bg-[#0071c2] hover:bg-[#005999] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors text-center whitespace-nowrap"
            >
              See availability &rsaquo;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const today    = offsetDate(0);
  const tomorrow = offsetDate(1);

  const [city,        setCity]        = useState(searchParams.get("city")     || "");
  const [checkIn,     setCheckIn]     = useState(searchParams.get("checkIn")  || today);
  const [checkOut,    setCheckOut]    = useState(searchParams.get("checkOut") || tomorrow);
  const [adults,      setAdults]      = useState(Number(searchParams.get("adults")) || 2);
  const [children,    setChildren]    = useState(Number(searchParams.get("children")) || 0);
  const [search,      setSearch]      = useState("");
  const [stars,       setStars]       = useState<number | null>(null);
  const [sortBy,      setSortBy]      = useState("recommended");
  const [viewMode,    setViewMode]    = useState<"list"|"grid">("list");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [budgetMin,      setBudgetMin]      = useState(400);
  const [budgetMax,      setBudgetMax]      = useState(15000);
  const [debouncedMin,   setDebouncedMin]   = useState(400);
  const [debouncedMax,   setDebouncedMax]   = useState(15000);
  const budgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleBudgetChange(min: number, max: number) {
    setBudgetMin(min);
    setBudgetMax(max);
    if (budgetTimer.current) clearTimeout(budgetTimer.current);
    budgetTimer.current = setTimeout(() => {
      setDebouncedMin(min);
      setDebouncedMax(max);
    }, 400);
  }
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Star filter from sidebar
  const starFilter = activeFilters.has("star_5") ? 5
    : activeFilters.has("star_4") ? 4
    : activeFilters.has("star_3") ? 3
    : activeFilters.has("star_2") ? 2
    : activeFilters.has("star_1") ? 1
    : stars;

  const queryParams = {
    city:         city || undefined,
    search:       search || undefined,
    star_rating:  starFilter || undefined,
    min_price:    debouncedMin > 400    ? debouncedMin : undefined,
    max_price:    debouncedMax < 15000  ? debouncedMax : undefined,
    page,
    size: 50, // fetch more so client-side sort works across full result set
  };

  const { data: hotelsRaw, isLoading } = useQuery<Hotel[]>({
    queryKey: ["hotels", queryParams],
    queryFn:  () => hotelsApi.list(queryParams).then(r => r.data),
    placeholderData: prev => prev,
  });

  // Client-side sort applied on top of API results
  const hotels = useMemo(() => {
    if (!hotelsRaw) return hotelsRaw;
    const arr = [...hotelsRaw];
    switch (sortBy) {
      case "price_asc":
        return arr.sort((a, b) => (a.min_price ?? 999999) - (b.min_price ?? 999999));
      case "price_desc":
        return arr.sort((a, b) => (b.min_price ?? 0) - (a.min_price ?? 0));
      case "stars_desc":
        return arr.sort((a, b) => b.star_rating - a.star_rating);
      case "stars_asc":
        return arr.sort((a, b) => a.star_rating - b.star_rating);
      case "name_asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      default: // "recommended" — keep API order
        return arr;
    }
  }, [hotelsRaw, sortBy]);

  useEffect(() => { setPage(1); }, [city, search, stars, activeFilters, debouncedMin, debouncedMax]);

  function toggleFilter(key: string) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city)    p.set("city",     city);
    p.set("checkIn",  checkIn);
    p.set("checkOut", checkOut);
    p.set("adults",   String(adults));
    p.set("children", String(children));
    router.push(`/guest/search?${p}`);
    setPage(1);
  }

  const n = checkIn && checkOut ? nights(checkIn, checkOut) : 1;
  const guestLabel = `${adults} adult${adults !== 1 ? "s" : ""} · ${children} child${children !== 1 ? "ren" : ""} · 1 room`;
  const activeCount = activeFilters.size + (stars ? 1 : 0);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f2f6fa]">

      {/* ── Top search bar (sticky) ─────────────────────────────────────── */}
      <div className="bg-[#003580] shadow-md sticky top-0 z-40">
        <form onSubmit={handleSearchSubmit} className="page-container py-3">
          <div className="flex flex-col lg:flex-row gap-2 items-stretch">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">

              {/* Destination */}
              <div className="flex-[2] bg-white rounded-lg border-2 border-[#FFC107] px-3 py-2 flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-surface-400 shrink-0" />
                <input
                  className="flex-1 text-sm font-medium text-navy-900 placeholder:text-surface-400 outline-none min-w-0"
                  placeholder="Where are you going?"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  list="cities-search"
                />
                {city && (
                  <button type="button" onClick={() => setCity("")}>
                    <X className="w-4 h-4 text-surface-400 hover:text-navy-900" />
                  </button>
                )}
                <datalist id="cities-search">
                  {["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Kolkata","Jaipur","Goa","Agra","Pune"].map(c => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Dates */}
              <div className="flex-[2] bg-white rounded-lg border-2 border-[#FFC107] px-3 py-2">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onSelect={(ci, co) => { setCheckIn(ci); if (co) setCheckOut(co); }}
                  placeholder="Check-in — Check-out"
                />
              </div>

              {/* Guests */}
              <div className="flex-[1.5] bg-white rounded-lg border-2 border-[#FFC107] px-3 py-2 flex items-center gap-2">
                <select
                  className="flex-1 text-sm font-medium text-navy-900 outline-none bg-transparent"
                  value={`${adults}_${children}`}
                  onChange={e => {
                    const [a, c] = e.target.value.split("_").map(Number);
                    setAdults(a); setChildren(c);
                  }}
                >
                  {[
                    ["1_0","1 adult · 0 children"],
                    ["2_0","2 adults · 0 children"],
                    ["2_1","2 adults · 1 child"],
                    ["2_2","2 adults · 2 children"],
                    ["3_0","3 adults · 0 children"],
                    ["4_0","4 adults · 0 children"],
                  ].map(([v, l]) => <option key={v} value={v}>{l} · 1 room</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#0071c2] hover:bg-[#005999] text-white font-bold px-8 py-2.5 rounded-lg text-sm transition-colors shrink-0"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="page-container py-6">
        {/* Breadcrumb */}
        {city && (
          <nav className="flex items-center gap-1.5 text-xs text-surface-400 mb-4">
            {["Home","India",city,"Search results"].map((b, i, arr) => (
              <span key={b} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-surface-300">›</span>}
                <span className={i === arr.length-1 ? "text-navy-900 font-medium" : "hover:underline cursor-pointer text-[#0071c2]"}>
                  {b}
                </span>
              </span>
            ))}
          </nav>
        )}

        <div className="flex gap-6">
          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="w-56 shrink-0 hidden lg:block">
            {/* Budget slider */}
            <div className="bg-white rounded-xl border border-surface-200 p-4 mb-4">
              <h3 className="font-bold text-sm text-navy-900 mb-1">Your budget (per night)</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-navy-900">{formatCurrency(budgetMin)}</span>
                <span className="text-xs text-surface-400">–</span>
                <span className="text-sm font-semibold text-navy-900">
                  {budgetMax >= 15000 ? "₹15,000+" : formatCurrency(budgetMax)}
                </span>
              </div>

              {/* Track */}
              <div className="relative h-5 flex items-center mb-4">
                <div className="absolute w-full h-1.5 bg-surface-200 rounded-full" />
                {/* Active range fill */}
                <div
                  className="absolute h-1.5 bg-[#0071c2] rounded-full"
                  style={{
                    left:  `${((budgetMin - 400)  / (15000 - 400)) * 100}%`,
                    right: `${((15000 - budgetMax) / (15000 - 400)) * 100}%`,
                  }}
                />
                {/* Min thumb */}
                <input
                  type="range"
                  min={400}
                  max={budgetMax - 500}
                  step={100}
                  value={budgetMin}
                  onChange={e => handleBudgetChange(Number(e.target.value), budgetMax)}
                  className="absolute w-full h-1.5 opacity-0 cursor-pointer z-10"
                />
                {/* Max thumb */}
                <input
                  type="range"
                  min={budgetMin + 500}
                  max={15000}
                  step={100}
                  value={budgetMax}
                  onChange={e => handleBudgetChange(budgetMin, Number(e.target.value))}
                  className="absolute w-full h-1.5 opacity-0 cursor-pointer z-20"
                />
                {/* Visual handles */}
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-[#0071c2] rounded-full shadow pointer-events-none"
                  style={{ left: `calc(${((budgetMin - 400) / (15000 - 400)) * 100}% - 8px)` }}
                />
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-[#0071c2] rounded-full shadow pointer-events-none"
                  style={{ left: `calc(${((budgetMax - 400) / (15000 - 400)) * 100}% - 8px)` }}
                />
              </div>

              {/* Quick budget chips */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[
                  { label: "Budget", min: 400,  max: 2000  },
                  { label: "Mid",    min: 2000, max: 6000  },
                  { label: "Luxury", min: 6000, max: 15000 },
                ].map(({ label, min, max }) => {
                  const active = budgetMin === min && budgetMax === max;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleBudgetChange(min, max)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                        active
                          ? "bg-[#0071c2] text-white border-[#0071c2]"
                          : "border-surface-200 text-surface-400 hover:border-[#0071c2] hover:text-[#0071c2]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Loading indicator when filtering */}
              {(debouncedMin !== budgetMin || debouncedMax !== budgetMax) && (
                <p className="text-xs text-[#0071c2] mt-2 animate-pulse">Filtering…</p>
              )}
            </div>

            {/* Filter blocks */}
            <div className="bg-white rounded-xl border border-surface-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-navy-900">Filter by:</h3>
                {activeCount > 0 && (
                  <button
                    onClick={() => setActiveFilters(new Set())}
                    className="text-xs text-[#0071c2] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {FILTER_SECTIONS.map(s => (
                <FilterBlock key={s.id} section={s} checked={activeFilters} onToggle={toggleFilter} />
              ))}
            </div>
          </aside>

          {/* ── Results ─────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h1 className="font-bold text-xl text-navy-900">
                  {city ? `${city}: ` : ""}{hotels?.length ?? 0} properties found
                </h1>
                {checkIn && checkOut && (
                  <p className="text-sm text-surface-400">
                    {fmtShort(checkIn)} – {fmtShort(checkOut)} · {n} night{n !== 1 ? "s" : ""} · {adults} adult{adults !== 1 ? "s" : ""}
                    {sortBy !== "recommended" && (
                      <span className="ml-2 inline-flex items-center gap-1 bg-[#0071c2]/10 text-[#0071c2] text-xs font-semibold px-2 py-0.5 rounded-full">
                        ↕ Sorted
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 text-sm font-semibold text-[#0071c2] border border-[#0071c2] px-3 py-1.5 rounded-lg"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters {activeCount > 0 && `(${activeCount})`}
                </button>

                {/* Sort */}
                <div className="flex items-center gap-1.5 text-sm">
                  <ArrowUpDown className="w-4 h-4 text-surface-400" />
                  <span className="text-surface-400 hidden sm:inline">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="text-sm font-semibold text-navy-900 bg-white border border-surface-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="recommended">Top picks for long stays</option>
                    <option value="price_asc">Price (lowest first)</option>
                    <option value="price_desc">Price (highest first)</option>
                    <option value="stars_desc">Stars (5 → 1)</option>
                    <option value="stars_asc">Stars (1 → 5)</option>
                    <option value="name_asc">Property name (A → Z)</option>
                  </select>
                </div>

                {/* View toggle */}
                <div className="flex border border-surface-200 rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("list")}
                    className={`px-2.5 py-1.5 ${viewMode==="list" ? "bg-[#0071c2] text-white" : "bg-white text-surface-400 hover:bg-surface-50"}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("grid")}
                    className={`px-2.5 py-1.5 ${viewMode==="grid" ? "bg-[#0071c2] text-white" : "bg-white text-surface-400 hover:bg-surface-50"}`}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Array.from(activeFilters).map(key => {
                  const opt = FILTER_SECTIONS.flatMap(s => s.options).find(o => o.key === key);
                  return (
                    <span key={key} className="flex items-center gap-1.5 bg-[#0071c2]/10 text-[#0071c2] border border-[#0071c2]/30 rounded-full px-3 py-1 text-xs font-semibold">
                      {opt?.label ?? key}
                      <button onClick={() => toggleFilter(key)}><X className="w-3 h-3" /></button>
                    </span>
                  );
                })}
                <button onClick={() => setActiveFilters(new Set())} className="text-xs text-surface-400 hover:text-navy-900 underline">
                  Clear all
                </button>
              </div>
            )}

            {/* Hotel list */}
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-surface-200 p-4 flex gap-4">
                    <Skeleton className="w-48 h-36 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-64" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <div className="w-32 space-y-2">
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <Skeleton className="h-5 w-24 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hotels?.length ? (
              <div className="bg-white rounded-xl border border-surface-200 p-16 text-center">
                <p className="text-3xl mb-4">🏨</p>
                <h3 className="font-bold text-lg text-navy-900 mb-2">No properties found</h3>
                <p className="text-surface-400 mb-6">Try a different city or adjust your filters.</p>
                <button onClick={() => { setActiveFilters(new Set()); setCity(""); }}
                  className="bg-[#0071c2] text-white font-bold px-6 py-2.5 rounded-lg text-sm hover:bg-[#005999] transition-colors">
                  Reset filters
                </button>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-4">
                {hotels.map(hotel => (
                  <HotelResultCard key={hotel.id} hotel={hotel} checkIn={checkIn} checkOut={checkOut} adults={adults} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {hotels.map(hotel => (
                  <div key={hotel.id} className="bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-shadow">
                    <img src={hotel.cover_photo_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=240&fit=crop"} alt={hotel.name} className="w-full h-44 object-cover" />
                    <div className="p-4">
                      <Link href={`/guest/hotel/${hotel.id}`} className="font-bold text-[#0071c2] hover:underline block mb-1 text-sm">{hotel.name}</Link>
                      <div className="flex items-center gap-1 mb-1.5">
                        {Array.from({ length: hotel.star_rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />)}
                      </div>
                      <p className="text-xs text-surface-400 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" />{hotel.city}</p>
                      <div className="flex items-end justify-between">
                        <div><p className="text-xs text-surface-400">from</p><p className="font-bold text-navy-900">{formatCurrency(2499 + hotel.id * 500)}</p><p className="text-[10px] text-surface-400">per night</p></div>
                        <Link href={`/guest/hotel/${hotel.id}`} className="bg-[#0071c2] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#005999] transition-colors">See rooms</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {hotels && hotels.length > 0 && (
              <div className="flex justify-center gap-2 mt-8">
                <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50 transition-colors">
                  ‹ Previous
                </button>
                {[1,2,3].map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page===p ? "bg-[#0071c2] text-white" : "border border-surface-200 hover:bg-surface-50 text-navy-900"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => p+1)}
                  className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-surface-50 transition-colors">
                  Next ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-surface-100 sticky top-0 bg-white">
              <h3 className="font-bold text-navy-900">Filter by</h3>
              <button onClick={() => setMobileFiltersOpen(false)}><X className="w-5 h-5 text-surface-400" /></button>
            </div>
            <div className="p-4">
              {FILTER_SECTIONS.map(s => (
                <FilterBlock key={s.id} section={s} checked={activeFilters} onToggle={toggleFilter} />
              ))}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-surface-100 p-4">
              <button onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[#0071c2] text-white font-bold py-3 rounded-xl text-sm">
                Show {hotels?.length ?? 0} properties
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}