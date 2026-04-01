"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { POPULAR_CITIES } from "@/lib/utils";

interface Props {
  defaultCity?:    string;
  defaultCheckIn?: string;
  defaultCheckOut?:string;
  defaultAdults?:  number;
  compact?:        boolean;
}

export default function BookingSearchBar({ defaultCity="", defaultCheckIn="", defaultCheckOut="", defaultAdults=1, compact=false }: Props) {
  const router   = useRouter();
  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [city,     setCity]     = useState(defaultCity);
  const [checkIn,  setCheckIn]  = useState(defaultCheckIn  || today);
  const [checkOut, setCheckOut] = useState(defaultCheckOut || tomorrow);
  const [adults,   setAdults]   = useState(defaultAdults);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city)    p.set("city",    city);
    if (checkIn) p.set("checkIn", checkIn);
    if (checkOut)p.set("checkOut",checkOut);
    p.set("adults", String(adults));
    router.push(`/guest/search?${p}`);
  }

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex gap-2 items-center bg-white border border-surface-200 rounded-2xl p-2 shadow-card">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input className="input pl-9 border-0 shadow-none focus:ring-0 h-9 text-sm" placeholder="City or hotel" value={city} onChange={e => setCity(e.target.value)} list="cities-compact" />
          <datalist id="cities-compact">{POPULAR_CITIES.map(c => <option key={c} value={c} />)}</datalist>
        </div>
        <input type="date" className="input border-0 shadow-none focus:ring-0 h-9 text-sm w-36" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} />
        <input type="date" className="input border-0 shadow-none focus:ring-0 h-9 text-sm w-36" value={checkOut} min={checkIn || tomorrow} onChange={e => setCheckOut(e.target.value)} />
        <button type="submit" className="btn-primary !py-2 !px-4 text-sm !rounded-xl gap-1.5 whitespace-nowrap">
          <Search className="w-4 h-4" /> Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white rounded-3xl p-4 shadow-deep">
      <div className="lg:col-span-2 relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input className="input pl-10" placeholder="City or hotel name" value={city} onChange={e => setCity(e.target.value)} list="cities-full" />
        <datalist id="cities-full">{POPULAR_CITIES.map(c => <option key={c} value={c} />)}</datalist>
      </div>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        <input type="date" className="input pl-10" value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} />
      </div>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        <input type="date" className="input pl-10" value={checkOut} min={checkIn || tomorrow} onChange={e => setCheckOut(e.target.value)} />
      </div>
      <button type="submit" className="btn-gold text-base font-semibold flex items-center justify-center gap-2 h-11">
        <Search className="w-4 h-4" /> Search Hotels
      </button>
    </form>
  );
}
