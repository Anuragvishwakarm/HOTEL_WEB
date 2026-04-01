"use client";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Wifi, Coffee, Dumbbell, Waves, Check, Heart } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Hotel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props { hotel: Hotel; }

const PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=280&fit=crop&auto=format";

export default function HotelCard({ hotel }: Props) {
  const [saved, setSaved] = useState(false);
  const amenities = (hotel.amenities || []).slice(0, 3);
  const price = hotel.min_price ?? null;

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg transition-all duration-200 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={hotel.cover_photo_url || PLACEHOLDER}
          alt={hotel.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Star badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/95 text-navy-900 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-0.5 shadow-sm">
            {hotel.star_rating}
            <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
          </span>
        </div>
        {/* Save button */}
        <button
          onClick={e => { e.preventDefault(); setSaved(v => !v); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
        >
          <Heart className={cn("w-4 h-4 transition-colors", saved ? "fill-red-500 text-red-500" : "text-surface-400")} />
        </button>
        {/* Verified badge */}
        {hotel.is_verified && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              ✓ Verified
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <Link href={`/guest/hotel/${hotel.id}`}>
          <h3 className="font-bold text-[#003580] hover:underline text-sm leading-snug mb-0.5 line-clamp-2">
            {hotel.name}
          </h3>
        </Link>

        {/* Location */}
        <p className="text-xs text-surface-400 flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 shrink-0" />
          {hotel.city}, {hotel.state}
        </p>

        {/* Amenity tags */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {amenities.map(a => (
              <span key={a} className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-medium">
                <Check className="w-2.5 h-2.5" /> {a}
              </span>
            ))}
          </div>
        )}

        {/* Free cancellation */}
        <p className="text-[11px] text-emerald-600 font-medium mb-3 flex items-center gap-1">
          <Check className="w-3 h-3" /> Free cancellation available
        </p>

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-surface-100">
          <div>
            {price ? (
              <>
                <p className="text-[10px] text-surface-400">Starts from</p>
                <p className="font-bold text-navy-900 text-base leading-none">{formatCurrency(price)}</p>
                <p className="text-[10px] text-surface-400">per night</p>
              </>
            ) : (
              <p className="text-xs text-surface-400">Check availability</p>
            )}
          </div>
          <Link
            href={`/guest/hotel/${hotel.id}`}
            className="bg-[#0071c2] hover:bg-[#005999] text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
          >
            See rooms
          </Link>
        </div>
      </div>
    </div>
  );
}