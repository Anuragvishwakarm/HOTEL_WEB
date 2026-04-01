"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Calendar, Users, ChevronDown,
  BedDouble, Shield, Star, ThumbsUp, HeadphonesIcon,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import HotelCard from "@/components/hotel/HotelCard";
import { HotelCardSkeleton } from "@/components/ui/Skeleton";
import { hotelsApi } from "@/lib/api";
import { POPULAR_CITIES } from "@/lib/utils";
import type { Hotel } from "@/lib/types";
import Link from "next/link";
import DateRangePicker from "@/components/ui/DateRangePicker";

// ── date helpers ──────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
function offsetDate(days: number) {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtShort(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HomePage() {
  const router = useRouter();

  const today    = offsetDate(0);
  const tomorrow = offsetDate(1);

  const [city,        setCity]        = useState("");
  const [checkIn,     setCheckIn]     = useState(today);
  const [checkOut,    setCheckOut]    = useState(tomorrow);
  // dates managed by DateRangePicker
  const [adults,      setAdults]      = useState(2);
  const [children,    setChildren]    = useState(0);
  const [showGuests,  setShowGuests]  = useState(false);
  const [showCities,  setShowCities]  = useState(false);
  const guestRef = useRef<HTMLDivElement>(null);
  const cityRef  = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (guestRef.current && !guestRef.current.contains(e.target as Node)) setShowGuests(false);
      if (cityRef.current  && !cityRef.current.contains(e.target as Node))  setShowCities(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const { data: featuredHotels, isLoading } = useQuery<Hotel[]>({
    queryKey: ["hotels", "featured"],
    queryFn:  () => hotelsApi.list({ size: 6 }).then(r => r.data),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city)    p.set("city",     city);
    p.set("checkIn",  checkIn);
    p.set("checkOut", checkOut);
    p.set("adults",   String(adults));
    p.set("children", String(children));
    router.push(`/guest/search?${p}`);
  }

  const nights = Math.max(0,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
  );
  const guestLabel = `${adults} adult${adults !== 1 ? "s" : ""} · ${children} child${children !== 1 ? "ren" : ""} · 1 room`;
  const dateLabel  = checkIn && checkOut ? `${fmtShort(checkIn)} — ${fmtShort(checkOut)}` : "Check-in — Check-out";

  return (
    <div className="bg-white">

      {/* ── Hero Banner ───────────────────────────────────────────────────────── */}
      <section
        className="relative"
        style={{ background: "linear-gradient(135deg, #003580 0%, #0071c2 100%)" }}
      >
        <div className="page-container pt-12 pb-24">

          {/* Headline */}
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            Find your next stay
          </h1>
          <p className="text-blue-200 text-base md:text-lg mb-10">
            Search low prices on hotels across India
          </p>

          {/* ── Search Bar ─────────────────────────────────────────────────── */}
          <form onSubmit={handleSearch}>
            <div className="flex flex-col lg:flex-row items-stretch gap-0 bg-[#FFC107] rounded-xl p-1 shadow-2xl">

              {/* Destination */}
              <div ref={cityRef} className="relative flex-[2]">
                <div
                  className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 h-full cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => setShowCities(v => !v)}
                >
                  <BedDouble className="w-5 h-5 text-surface-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full text-sm font-medium text-navy-900 placeholder:text-surface-400 outline-none bg-transparent cursor-pointer"
                      placeholder="Where are you going?"
                      value={city}
                      onChange={e => { setCity(e.target.value); setShowCities(true); }}
                      onFocus={() => setShowCities(true)}
                      autoComplete="off"
                    />
                  </div>
                </div>
                {/* City suggestions dropdown */}
                {showCities && (
                  <div className="absolute top-full left-0 z-50 mt-1 bg-white rounded-xl shadow-deep border border-surface-100 w-full max-h-64 overflow-y-auto">
                    {(city
                      ? POPULAR_CITIES.filter(c => c.toLowerCase().includes(city.toLowerCase()))
                      : POPULAR_CITIES
                    ).map(c => (
                      <button
                        key={c}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left text-sm text-navy-900 transition-colors"
                        onClick={() => { setCity(c); setShowCities(false); }}
                      >
                        <MapPin className="w-4 h-4 text-surface-400 shrink-0" />
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px bg-[#FFC107] hidden lg:block" />

              {/* Dates - DateRangePicker */}
              <div className="flex-[2] bg-white rounded-lg px-4 py-3">
                <DateRangePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
                />
              </div>

              {/* Divider */}
              <div className="w-px bg-[#FFC107] hidden lg:block" />

              {/* Guests */}
              <div ref={guestRef} className="flex-[2] relative">
                <button
                  type="button"
                  onClick={() => setShowGuests(v => !v)}
                  className="w-full flex items-center gap-2 bg-white rounded-lg px-4 py-3 h-full hover:bg-blue-50 transition-colors text-left"
                >
                  <Users className="w-5 h-5 text-surface-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-navy-900">{guestLabel}</span>
                  <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${showGuests ? "rotate-180" : ""}`} />
                </button>

                {showGuests && (
                  <div className="absolute top-full left-0 z-50 mt-1 bg-white rounded-xl shadow-deep border border-surface-100 p-5 w-72">
                    <div className="space-y-5">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-navy-900">Adults</p>
                          <p className="text-xs text-surface-400">Age 18 or above</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button"
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="w-8 h-8 rounded-full border-2 border-[#0071c2] text-[#0071c2] font-bold text-lg flex items-center justify-center hover:bg-blue-50 transition-colors disabled:opacity-30"
                            disabled={adults <= 1}>−</button>
                          <span className="text-sm font-bold text-navy-900 w-4 text-center">{adults}</span>
                          <button type="button"
                            onClick={() => setAdults(Math.min(30, adults + 1))}
                            className="w-8 h-8 rounded-full border-2 border-[#0071c2] text-[#0071c2] font-bold text-lg flex items-center justify-center hover:bg-blue-50 transition-colors">+</button>
                        </div>
                      </div>
                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-navy-900">Children</p>
                          <p className="text-xs text-surface-400">Age 0–17</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button"
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="w-8 h-8 rounded-full border-2 border-[#0071c2] text-[#0071c2] font-bold text-lg flex items-center justify-center hover:bg-blue-50 transition-colors disabled:opacity-30"
                            disabled={children <= 0}>−</button>
                          <span className="text-sm font-bold text-navy-900 w-4 text-center">{children}</span>
                          <button type="button"
                            onClick={() => setChildren(Math.min(10, children + 1))}
                            className="w-8 h-8 rounded-full border-2 border-[#0071c2] text-[#0071c2] font-bold text-lg flex items-center justify-center hover:bg-blue-50 transition-colors">+</button>
                        </div>
                      </div>
                      {/* Rooms (display only for now) */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-navy-900">Rooms</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" className="w-8 h-8 rounded-full border-2 border-[#0071c2] text-[#0071c2] font-bold text-lg flex items-center justify-center opacity-30" disabled>−</button>
                          <span className="text-sm font-bold text-navy-900 w-4 text-center">1</span>
                          <button type="button" className="w-8 h-8 rounded-full border-2 border-[#0071c2] text-[#0071c2] font-bold text-lg flex items-center justify-center opacity-30" disabled>+</button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuests(false)}
                      className="mt-5 w-full bg-[#0071c2] text-white text-sm font-bold py-2.5 rounded-lg hover:bg-[#005999] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="bg-[#0071c2] hover:bg-[#005999] text-white font-bold px-8 py-3 rounded-lg text-sm transition-colors shrink-0 flex items-center gap-2 shadow-md"
              >
                <Search className="w-4 h-4" /> Search
              </button>
            </div>
          </form>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 32" className="w-full" preserveAspectRatio="none" style={{ height: 32 }}>
            <path d="M0,32 C360,0 1080,0 1440,32 L1440,32 L0,32 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Why HotelBook ─────────────────────────────────────────────────────── */}
      <section className="page-container py-12">
        <h2 className="font-display text-xl font-bold text-navy-900 mb-6">Why HotelBook?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <ThumbsUp  className="w-8 h-8 text-[#0071c2]" />, title: "Book now, pay at the hotel",  desc: "Free cancellation on most rooms." },
            { icon: <Star      className="w-8 h-8 text-[#0071c2]" />, title: "Verified guest reviews",      desc: "Read honest reviews from real guests." },
            { icon: <Shield    className="w-8 h-8 text-[#0071c2]" />, title: "Secure payments",             desc: "UPI, card & net banking via Razorpay." },
            { icon: <HeadphonesIcon className="w-8 h-8 text-[#0071c2]" />, title: "24/7 Support",          desc: "We're always here to help you." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-5 rounded-xl border border-surface-100 bg-white hover:shadow-card transition-shadow">
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div>
                <p className="font-semibold text-navy-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-surface-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Destinations ──────────────────────────────────────────────── */}
      <section className="page-container pb-12">
        <h2 className="font-display text-xl font-bold text-navy-900 mb-5">Popular Destinations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_CITIES.slice(0, 12).map(c => (
            <button
              key={c}
              onClick={() => router.push(`/guest/search?city=${c}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`)}
              className="group relative overflow-hidden rounded-xl aspect-[4/3] bg-gradient-to-br from-[#003580] to-[#0071c2] hover:from-[#0071c2] hover:to-[#003580] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <MapPin className="w-5 h-5 text-white/60 mb-1.5 group-hover:text-white/90 transition-colors" />
                <span className="text-white font-semibold text-sm text-center leading-tight">{c}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured Hotels ───────────────────────────────────────────────────── */}
      <section className="bg-[#f2f6fa] py-12">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900">Featured Hotels</h2>
              <p className="text-surface-400 text-sm mt-0.5">Handpicked stays for your next trip</p>
            </div>
            <Link
              href="/guest/search"
              className="text-[#0071c2] text-sm font-semibold hover:underline flex items-center gap-1"
            >
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <HotelCardSkeleton key={i} />)
              : featuredHotels?.map(hotel => <HotelCard key={hotel.id} hotel={hotel} />)
            }
          </div>
        </div>
      </section>

      {/* ── Offers / CTA banner ───────────────────────────────────────────────── */}
      <section className="page-container py-12">
        <h2 className="font-display text-xl font-bold text-navy-900 mb-5">Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Offer 1 */}
          <div
            className="relative rounded-2xl overflow-hidden min-h-[160px] flex items-end p-6"
            style={{ background: "linear-gradient(135deg, #003580, #0071c2)" }}
          >
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format')] bg-cover bg-center" />
            <div className="relative z-10">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Limited time</p>
              <h3 className="font-display font-bold text-white text-xl mb-1">Early 2026 Deals</h3>
              <p className="text-blue-100 text-sm mb-4">Save on select rooms when you book early.</p>
              <button
                onClick={() => router.push("/guest/search")}
                className="bg-white text-[#003580] text-sm font-bold px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Find deals
              </button>
            </div>
          </div>
          {/* Offer 2 */}
          <div
            className="relative rounded-2xl overflow-hidden min-h-[160px] flex items-end p-6"
            style={{ background: "linear-gradient(135deg, #6B21A8, #9333EA)" }}
          >
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&auto=format')] bg-cover bg-center" />
            <div className="relative z-10">
              <p className="text-purple-200 text-xs font-semibold uppercase tracking-wider mb-1">Weekend getaway</p>
              <h3 className="font-display font-bold text-white text-xl mb-1">No catch. Just getaways.</h3>
              <p className="text-purple-100 text-sm mb-4">Weekend prices on top-rated hotels.</p>
              <button
                onClick={() => router.push("/guest/search")}
                className="bg-white text-purple-800 text-sm font-bold px-5 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Explore
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer strip ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-100 bg-white">
        <div className="page-container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#003580] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-black">H</span>
              </div>
              <span className="font-display font-bold text-navy-900 text-sm">HotelBook</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-surface-400">
              {["About","Help Centre","Privacy","Terms","Partner with us"].map(l => (
                <Link key={l} href="#" className="hover:text-navy-900 transition-colors">{l}</Link>
              ))}
            </div>
            <p className="text-xs text-surface-400">© 2026 HotelBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}