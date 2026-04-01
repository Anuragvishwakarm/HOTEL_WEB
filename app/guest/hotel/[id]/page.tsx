"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Star, Wifi, Car, Coffee, Dumbbell, Waves,
  CheckCircle2, XCircle, ChevronRight, Heart, Share2,
  Users, BedDouble, Maximize2, Check, X, Plus, Minus,
  Phone, Mail, Clock, ShieldCheck, ChevronDown, ChevronUp,
  Camera,
} from "lucide-react";
import { hotelsApi, bookingsApi } from "@/lib/api";
import { formatCurrency, gstRate } from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import type { Hotel, RoomType, AvailabilityResult } from "@/lib/types";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ── helpers ───────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, "0");
function offsetDate(days: number) {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function nights(ci: string, co: string) {
  return Math.max(0, Math.round((new Date(co).getTime()-new Date(ci).getTime())/86_400_000));
}
function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
}

const PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&h=500&fit=crop&auto=format";
const ROOM_PHOTOS = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop",
];

// ── Mock review data ──────────────────────────────────────────────────────────
const REVIEWS = [
  { name:"Rahul", country:"India", text:"Excellent service and very clean rooms. The location is perfect and staff were very helpful throughout our stay.", score:9.0 },
  { name:"Sarah", country:"United Kingdom", text:"Great location near the station. Rooms were comfortable and the WiFi worked perfectly. Would stay again!", score:8.5 },
  { name:"Marco", country:"Italy", text:"Very nice property, clean rooms and friendly staff. Easy access to metro. Recommended for budget travelers.", score:8.0 },
  { name:"Priya", country:"India", text:"Good value for money. Breakfast was excellent. Staff went above and beyond to make our stay comfortable.", score:9.2 },
];

const NEARBY = [
  { type:"🏛️", name:"Red Fort",              dist:"4.5 km" },
  { type:"🚉", name:"New Delhi Railway Stn", dist:"600 m"  },
  { type:"🚇", name:"New Delhi Metro",        dist:"950 m"  },
  { type:"🏛️", name:"India Gate",             dist:"4.3 km" },
  { type:"✈️", name:"Delhi Airport",          dist:"15 km"  },
  { type:"🍽️", name:"Chawla Restaurant",      dist:"10 m"   },
];

const TABS = ["Overview","Info & prices","Facilities","House rules","Guest reviews"];

const FACILITIES_MAP: Record<string, string[]> = {
  "Bathroom":    ["Free toiletries","Shower","Toilet","Private bathroom","Towels","Slippers"],
  "Bedroom":     ["Air conditioning","Flat-screen TV","Soundproof rooms","Electric kettle"],
  "Internet":    ["Free WiFi in all rooms"],
  "Services":    ["24-hour front desk","Room service","Concierge","Tour desk","Luggage storage"],
  "Transport":   ["Airport shuttle","Car hire","Public transport tickets"],
  "Safety":      ["CCTV","Smoke alarms","Fire extinguishers","24-hr security"],
  "General":     ["Lift","Terrace","Daily housekeeping","Laundry","Family rooms"],
};

// ── Room type card ─────────────────────────────────────────────────────────────
function RoomCard({
  rt, checkIn, checkOut, adults, children, hotelId, onBook,
}: {
  rt: RoomType; checkIn: string; checkOut: string; adults: number; children: number; hotelId: number;
  onBook: (rt: RoomType, room: { room_id:number;room_number:string;floor:number }|null, avail: AvailabilityResult) => void;
}) {
  const [qty, setQty]     = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [avail, setAvail]   = useState<AvailabilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<{room_id:number;room_number:string;floor:number}|null>(null);

  const n = checkIn && checkOut ? nights(checkIn, checkOut) : 1;
  const gst   = gstRate(Number(rt.base_price));
  const subtotal = Number(rt.base_price) * n;
  const gstAmt   = Math.round(subtotal * gst) / 100;
  const total    = subtotal + gstAmt;

  async function checkAvailability() {
    if (!checkIn || !checkOut) { toast.error("Please select dates first"); return; }
    setLoading(true);
    try {
      const { data } = await bookingsApi.checkAvailability({ hotel_id: hotelId, room_type_id: rt.id, check_in: checkIn, check_out: checkOut, adults, children });
      setAvail(data);
      setChecked(true);
    } catch { toast.error("Could not check availability"); }
    finally { setLoading(false); }
  }

  const amenityIcons: Record<string,string> = { "WiFi":"📶","AC":"❄️","TV":"📺","Bathroom":"🚿","Breakfast":"🍳","Balcony":"🌅" };

  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden mb-4">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-0">
        {/* Room image */}
        <div className="relative bg-surface-100 md:h-auto h-44">
          <img src={ROOM_PHOTOS[rt.id % ROOM_PHOTOS.length]} alt={rt.name} className="w-full h-full object-cover" />
        </div>

        {/* Room info */}
        <div className="p-4 border-x border-surface-100">
          <h3 className="font-bold text-[#003580] text-base mb-1">{rt.name}</h3>
          <div className="flex flex-wrap gap-2 text-xs text-surface-500 mb-3">
            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{rt.bed_type.replace(/_/g," ")}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max {rt.max_occupancy} guests</span>
            {rt.area_sqft && <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" />{rt.area_sqft} sq ft</span>}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(rt.amenities||[]).slice(0, expanded ? 20 : 5).map(a => (
              <span key={a} className="text-xs text-emerald-700 flex items-center gap-0.5 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" /> {a}
              </span>
            ))}
          </div>
          {(rt.amenities||[]).length > 5 && (
            <button onClick={() => setExpanded(v=>!v)} className="text-xs text-[#0071c2] hover:underline flex items-center gap-0.5">
              {expanded ? <><ChevronUp className="w-3 h-3"/>Show less</> : <><ChevronDown className="w-3 h-3"/>Show all {rt.amenities?.length} amenities</>}
            </button>
          )}

          {/* Perks */}
          <div className="mt-3 space-y-1">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3"/>Free cancellation before check-in</p>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3"/>No prepayment needed – pay at the property</p>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3"/>No credit card needed</p>
          </div>
        </div>

        {/* Price + booking */}
        <div className="p-4 flex flex-col justify-between bg-surface-50">
          {/* Price */}
          <div>
            {n > 1 && <p className="text-xs text-surface-400 mb-0.5">{n} nights, {adults} adults</p>}
            <p className="font-bold text-navy-900 text-xl leading-none">{formatCurrency(total)}</p>
            <p className="text-xs text-surface-400">+{formatCurrency(gstAmt)} taxes ({gst}% GST)</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">{formatCurrency(subtotal/n)}/night</p>
          </div>

          {/* Available rooms after check */}
          {checked && avail && (
            <div className={`mt-2 p-2 rounded-lg text-xs ${avail.available ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
              {avail.available ? (
                <>
                  <p className="font-semibold text-emerald-700 mb-1.5">✓ {avail.available_rooms_count} room{avail.available_rooms_count > 1 ? "s" : ""} available</p>
                  <div className="flex flex-wrap gap-1">
                    {(avail.available_rooms as any[]).map((r: any) => (
                      <button key={r.room_id}
                        onClick={() => setSelectedRoom(selectedRoom?.room_id === r.room_id ? null : r)}
                        className={cn("px-2 py-1 rounded-md border font-mono font-bold text-[10px] transition-all",
                          selectedRoom?.room_id === r.room_id ? "bg-[#003580] text-white border-[#003580]" : "bg-white text-navy-900 border-emerald-300 hover:border-[#003580]")}>
                        {r.room_number}
                      </button>
                    ))}
                  </div>
                  {selectedRoom && <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Room {selectedRoom.room_number} selected</p>}
                </>
              ) : (
                <p className="text-red-600 font-semibold">✗ Not available for these dates</p>
              )}
            </div>
          )}

          {/* Qty selector */}
          <div className="mt-3">
            {!checked ? (
              <button onClick={checkAvailability} disabled={loading}
                className="w-full bg-[#0071c2] hover:bg-[#005999] text-white text-xs font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60">
                {loading ? "Checking…" : "Check availability"}
              </button>
            ) : avail?.available ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-surface-400">Rooms:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(q => Math.max(0,q-1))}
                      className="w-6 h-6 rounded-full border-2 border-[#0071c2] text-[#0071c2] flex items-center justify-center font-bold hover:bg-blue-50 disabled:opacity-30 transition-colors"
                      disabled={qty<=0}><Minus className="w-3 h-3"/></button>
                    <span className="font-bold text-sm w-4 text-center">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(q+1, avail.available_rooms_count))}
                      className="w-6 h-6 rounded-full border-2 border-[#0071c2] text-[#0071c2] flex items-center justify-center font-bold hover:bg-blue-50 transition-colors">
                      <Plus className="w-3 h-3"/></button>
                  </div>
                </div>
                <button
                  disabled={qty === 0}
                  onClick={() => { if (qty > 0) onBook(rt, selectedRoom, avail); }}
                  className="w-full bg-[#e7711b] hover:bg-[#cf6418] disabled:bg-surface-200 disabled:text-surface-400 text-white text-xs font-bold py-2.5 rounded-lg transition-colors">
                  {qty === 0 ? "Select rooms" : `Reserve ${qty} room${qty>1?"s":""} →`}
                </button>
              </>
            ) : (
              <button onClick={() => { setChecked(false); setAvail(null); }}
                className="w-full border border-[#0071c2] text-[#0071c2] text-xs font-bold py-2.5 rounded-lg hover:bg-blue-50 transition-colors">
                Change dates
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HotelDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const store    = useBookingStore();
  const today    = offsetDate(0);
  const tomorrow = offsetDate(1);

  const [checkIn,   setCheckIn]   = useState(today);
  const [checkOut,  setCheckOut]  = useState(tomorrow);
  const [adults,    setAdults]    = useState(2);
  const [children,  setChildren]  = useState(0);
  const [activeTab, setActiveTab] = useState("Overview");
  const [saved,     setSaved]     = useState(false);
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const [lightbox,  setLightbox]  = useState(false);

  const tabRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    "Overview":       useRef<HTMLDivElement>(null),
    "Info & prices":  useRef<HTMLDivElement>(null),
    "Facilities":     useRef<HTMLDivElement>(null),
    "House rules":    useRef<HTMLDivElement>(null),
    "Guest reviews":  useRef<HTMLDivElement>(null),
  };

  const { data: hotel, isLoading: hLoading } = useQuery<Hotel>({
    queryKey: ["hotel", id],
    queryFn: () => hotelsApi.get(Number(id)).then(r => r.data),
  });
  const { data: roomTypes, isLoading: rtLoading } = useQuery<RoomType[]>({
    queryKey: ["roomTypes", id],
    queryFn: () => hotelsApi.getRoomTypes(Number(id)).then(r => r.data),
  });

  const n = nights(checkIn, checkOut);

  function scrollToTab(tab: string) {
    setActiveTab(tab);
    tabRefs[tab]?.current?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function handleBook(rt: RoomType, room: {room_id:number;room_number:string;floor:number}|null, avail: AvailabilityResult) {
    store.setHotel(hotel!);
    store.setRoomType(rt);
    store.setDates(checkIn, checkOut);
    store.setGuests(adults, children);
    store.setAvailability(avail);
    store.setSelectedRoom(room);
    router.push("/guest/booking");
  }

  if (hLoading) return (
    <div className="bg-white min-h-screen">
      <div className="page-container py-6 space-y-4">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><Skeleton key={i} className="h-48"/>)}</div>
      </div>
    </div>
  );
  if (!hotel) return <div className="page-container py-20 text-center text-surface-400">Hotel not found.</div>;

  const allPhotos = [hotel.cover_photo_url || PLACEHOLDER, ...ROOM_PHOTOS];
  const amenities = hotel.amenities || [];

  return (
    <div className="bg-white min-h-screen">

      {/* ── Sticky tabs ──────────────────────────────────────────────────── */}
      <div className="sticky top-14 z-30 bg-white border-b border-surface-200 shadow-sm">
        <div className="page-container">
          <nav className="flex overflow-x-auto gap-0 hide-scrollbar">
            {TABS.map(tab => (
              <button key={tab} onClick={() => scrollToTab(tab)}
                className={cn("px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab ? "border-[#0071c2] text-[#0071c2]" : "border-transparent text-surface-400 hover:text-navy-900")}>
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-[#0071c2] mb-4 flex-wrap">
          {["Home","Hotels","India",hotel.state,hotel.city,hotel.name].map((b,i,arr)=>(
            <span key={b} className="flex items-center gap-1">
              {i>0 && <ChevronRight className="w-3 h-3 text-surface-300"/>}
              {i<arr.length-1
                ? <Link href={i===0?"/":i===1?"/guest/search":`/guest/search?city=${encodeURIComponent(b)}`} className="hover:underline">{b}</Link>
                : <span className="text-surface-400 truncate max-w-[200px]">{b}</span>}
            </span>
          ))}
        </nav>

        {/* ── Hotel header ────────────────────────────────────────────── */}
        <div ref={tabRefs["Overview"]}>
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 mb-1">
                {Array.from({length: hotel.star_rating}).map((_,i)=>(
                  <Star key={i} className="w-4 h-4 fill-[#FFC107] text-[#FFC107]"/>
                ))}
              </div>
              <h1 className="font-bold text-2xl text-navy-900 mb-2">{hotel.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-surface-400">
                <span className="text-[#0071c2] hover:underline cursor-pointer flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5"/> {hotel.address}, {hotel.city}, {hotel.state}
                  <span className="text-surface-300">–</span>
                  <span className="text-[#0071c2]">Great location – show map</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={()=>setSaved(v=>!v)}
                className="flex items-center gap-1.5 px-3 py-2 border border-surface-200 rounded-lg text-sm hover:bg-surface-50 transition-colors">
                <Heart className={cn("w-4 h-4",saved?"fill-red-500 text-red-500":"text-surface-400")}/> Save
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-surface-200 rounded-lg text-sm hover:bg-surface-50 transition-colors">
                <Share2 className="w-4 h-4 text-surface-400"/> Share
              </button>
              <button onClick={()=>scrollToTab("Info & prices")}
                className="bg-[#0071c2] hover:bg-[#005999] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
                Reserve
              </button>
            </div>
          </div>

          {/* Photo gallery + review panel */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mb-6">
            {/* Photos */}
            <div>
              <div className="grid grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-1.5 h-80 rounded-xl overflow-hidden">
                {/* Main large photo */}
                <div className="row-span-2 relative cursor-pointer" onClick={()=>setLightbox(true)}>
                  <img src={allPhotos[0]} alt={hotel.name} className="w-full h-full object-cover hover:brightness-95 transition-all"/>
                </div>
                {/* 4 smaller photos */}
                {allPhotos.slice(1,5).map((src,i)=>(
                  <div key={i} className="relative overflow-hidden cursor-pointer" onClick={()=>{setPhotoIdx(i+1);setLightbox(true);}}>
                    <img src={src} alt="" className="w-full h-full object-cover hover:brightness-95 transition-all"/>
                    {i===3 && allPhotos.length > 5 && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                        <Camera className="w-5 h-5 mb-1"/>
                        <span className="text-sm font-bold">+{allPhotos.length-5} photos</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Review + map panel */}
            <div className="space-y-3">
              {/* Score */}
              <div className="border border-surface-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-[#003580] rounded-tl-xl rounded-tr-xl rounded-br-xl flex items-center justify-center text-white font-bold text-lg">
                    8.2
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm">Very good</p>
                    <p className="text-xs text-surface-400">410 reviews</p>
                  </div>
                </div>
                <p className="text-xs text-surface-400 italic mb-2">"Guests who stayed here loved…"</p>
                <p className="text-xs text-navy-900 italic">"{REVIEWS[0].text.slice(0,80)}…"</p>
                <button onClick={()=>scrollToTab("Guest reviews")} className="text-xs text-[#0071c2] hover:underline mt-2 flex items-center gap-1">
                  Read all reviews <ChevronRight className="w-3 h-3"/>
                </button>

                {/* Category scores */}
                <div className="mt-3 space-y-1.5">
                  {[["Staff","8.9"],["Cleanliness","8.3"],["Location","8.6"],["Free WiFi","9.4"]].map(([k,v])=>(
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-xs text-surface-400 w-20 shrink-0">{k}</span>
                      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#003580] rounded-full" style={{width:`${parseFloat(v)/10*100}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-navy-900 w-6">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map thumbnail */}
              <div className="border border-surface-200 rounded-xl overflow-hidden">
                <div className="h-28 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-[#003580] mx-auto mb-1"/>
                    <p className="text-xs font-semibold text-navy-900">{hotel.city}</p>
                  </div>
                </div>
                <div className="p-2.5">
                  <button className="w-full bg-[#0071c2] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#005999] transition-colors">
                    Show on map
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* About section */}
          {hotel.description && (
            <div className="mb-6 border border-surface-200 rounded-xl p-5">
              <h2 className="font-bold text-lg text-navy-900 mb-3">About this property</h2>
              <p className="text-sm text-surface-500 leading-relaxed">{hotel.description}</p>
            </div>
          )}

          {/* Top facilities badges */}
          <div className="mb-6">
            <h2 className="font-bold text-base text-navy-900 mb-3">Most popular facilities</h2>
            <div className="flex flex-wrap gap-2">
              {(amenities.length ? amenities : ["Free WiFi","Room service","24-hr front desk","Air conditioning","Restaurant","Parking","Laundry"]).map(a=>(
                <span key={a} className="flex items-center gap-1.5 text-sm text-navy-900 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <Check className="w-3.5 h-3.5 text-emerald-600"/> {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Info & Prices ────────────────────────────────────────────── */}
        <div ref={tabRefs["Info & prices"]} className="scroll-mt-24">
          <h2 className="font-bold text-xl text-navy-900 mb-2 pt-4 border-t border-surface-100">
            Availability
          </h2>

          {/* Search bar */}
          <div className="bg-[#f2f6fa] border border-surface-200 rounded-xl p-4 mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-3 items-end">
              <div>
                <p className="text-xs font-semibold text-navy-900 mb-1.5">Check-in</p>
                <div className="bg-white border border-surface-200 rounded-lg px-3 py-2.5">
                  <DateRangePicker checkIn={checkIn} checkOut={checkOut}
                    onSelect={(ci,co)=>{setCheckIn(ci);if(co)setCheckOut(co);}}
                    placeholder="Select dates" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-semibold text-navy-900 mb-1.5">Adults</p>
                  <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-lg px-3 py-2.5">
                    <button onClick={()=>setAdults(a=>Math.max(1,a-1))} className="text-[#0071c2] font-bold"><Minus className="w-3 h-3"/></button>
                    <span className="text-sm font-bold flex-1 text-center">{adults}</span>
                    <button onClick={()=>setAdults(a=>Math.min(10,a+1))} className="text-[#0071c2] font-bold"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-navy-900 mb-1.5">Children</p>
                  <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-lg px-3 py-2.5">
                    <button onClick={()=>setChildren(c=>Math.max(0,c-1))} className="text-[#0071c2] font-bold disabled:opacity-30" disabled={children<=0}><Minus className="w-3 h-3"/></button>
                    <span className="text-sm font-bold flex-1 text-center">{children}</span>
                    <button onClick={()=>setChildren(c=>Math.min(5,c+1))} className="text-[#0071c2] font-bold"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
              </div>
              <div className="sm:col-span-1">
                <p className="text-xs text-surface-400 mb-1.5">&nbsp;</p>
                <div className="text-sm text-navy-900 bg-white border border-surface-200 rounded-lg px-3 py-2.5 font-medium whitespace-nowrap">
                  {n} night{n!==1?"s":""}
                </div>
              </div>
              <div className="sm:col-span-1 hidden sm:block"/>
            </div>
            {checkIn && checkOut && (
              <p className="text-xs text-surface-400 mt-2">
                Showing prices for: <strong className="text-navy-900">{fmtDate(checkIn)} — {fmtDate(checkOut)}</strong>
                · {adults} adult{adults>1?"s":""}{children>0?`, ${children} child${children>1?"ren":""}`:""}
              </p>
            )}
          </div>

          {/* Room type cards */}
          {rtLoading ? (
            <div className="space-y-4">{[1,2].map(i=><Skeleton key={i} className="h-48"/>)}</div>
          ) : (
            <>
              <p className="text-xs text-surface-400 mb-3">Select a room type to check availability and reserve</p>
              {roomTypes?.map(rt => (
                <RoomCard key={rt.id} rt={rt} checkIn={checkIn} checkOut={checkOut}
                  adults={adults} children={children} hotelId={hotel.id} onBook={handleBook} />
              ))}
            </>
          )}

          {/* Fine print */}
          <div className="bg-[#fef3c7] border border-amber-200 rounded-xl p-4 mt-4">
            <p className="text-xs font-bold text-amber-800 mb-1">The fine print</p>
            <p className="text-xs text-amber-700">You won't be charged until check-in. All prices include applicable GST. Free cancellation available on most rooms — check individual room policies above.</p>
          </div>
        </div>

        {/* ── Facilities ───────────────────────────────────────────────── */}
        <div ref={tabRefs["Facilities"]} className="scroll-mt-24 mt-8 pt-6 border-t border-surface-100">
          <h2 className="font-bold text-xl text-navy-900 mb-5">Hotel Facilities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(FACILITIES_MAP).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-navy-900 mb-2">{category}</h3>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-surface-500">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0"/> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── House Rules ──────────────────────────────────────────────── */}
        <div ref={tabRefs["House rules"]} className="scroll-mt-24 mt-8 pt-6 border-t border-surface-100">
          <h2 className="font-bold text-xl text-navy-900 mb-5">House Rules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon:<Clock className="w-5 h-5 text-[#0071c2]"/>,  label:"Check-in",    val:`From ${hotel.check_in_time}` },
              { icon:<Clock className="w-5 h-5 text-[#0071c2]"/>,  label:"Check-out",   val:`Until ${hotel.check_out_time}` },
              { icon:<X className="w-5 h-5 text-red-400"/>,        label:"Cancellation",val:"Free before check-in date" },
              { icon:<Users className="w-5 h-5 text-[#0071c2]"/>,  label:"Children",    val:"Children of all ages welcome" },
              { icon:<X className="w-5 h-5 text-red-400"/>,        label:"Pets",        val:"Pets are not allowed" },
              { icon:<X className="w-5 h-5 text-red-400"/>,        label:"Parties",     val:"Parties / events not allowed" },
            ].map(({icon,label,val}) => (
              <div key={label} className="flex items-start gap-3 p-4 border border-surface-200 rounded-xl">
                <div className="mt-0.5">{icon}</div>
                <div>
                  <p className="text-xs text-surface-400 font-medium">{label}</p>
                  <p className="text-sm text-navy-900 font-semibold mt-0.5">{val}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Guest Reviews ────────────────────────────────────────────── */}
        <div ref={tabRefs["Guest reviews"]} className="scroll-mt-24 mt-8 pt-6 border-t border-surface-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-xl text-navy-900">Guest Reviews</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#003580] rounded-tl-xl rounded-tr-xl rounded-br-xl flex items-center justify-center text-white font-bold text-xl">8.2</div>
              <div>
                <p className="font-bold text-navy-900">Very good</p>
                <p className="text-sm text-surface-400">410 verified reviews</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {REVIEWS.map((r,i) => (
              <div key={i} className="border border-surface-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#003580] flex items-center justify-center text-white font-bold text-sm">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-navy-900">{r.name}</p>
                    <p className="text-xs text-surface-400">{r.country}</p>
                  </div>
                  <div className="ml-auto bg-[#003580] text-white text-xs font-bold px-2 py-1 rounded-lg">{r.score}</div>
                </div>
                <p className="text-sm text-surface-500 leading-relaxed italic">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Nearby attractions ───────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-surface-100">
          <h2 className="font-bold text-xl text-navy-900 mb-5">Hotel Surroundings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NEARBY.map(({ type, name, dist }) => (
              <div key={name} className="flex items-center gap-3 p-3 border border-surface-200 rounded-xl text-sm">
                <span className="text-xl">{type}</span>
                <div>
                  <p className="font-medium text-navy-900 text-sm leading-tight">{name}</p>
                  <p className="text-xs text-surface-400">{dist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact bar ──────────────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-surface-100">
          <div className="bg-[#003580] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <p className="font-bold text-lg mb-1">{hotel.name}</p>
              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                {hotel.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4"/>{hotel.phone}</span>}
                {hotel.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4"/>{hotel.email}</span>}
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/>{hotel.city}, {hotel.state}</span>
              </div>
            </div>
            <button onClick={()=>scrollToTab("Info & prices")}
              className="shrink-0 bg-[#e7711b] hover:bg-[#cf6418] text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
              Reserve Now →
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-8 h-8"/></button>
          <img src={allPhotos[photoIdx]} alt="" className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={e=>e.stopPropagation()}/>
          <div className="absolute bottom-4 flex gap-2">
            {allPhotos.slice(0,6).map((src,i)=>(
              <div key={i} onClick={e=>{e.stopPropagation();setPhotoIdx(i);}}
                className={cn("w-12 h-12 rounded-lg overflow-hidden cursor-pointer border-2 transition-all", i===photoIdx?"border-white":"border-transparent opacity-60 hover:opacity-100")}>
                <img src={src} alt="" className="w-full h-full object-cover"/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}