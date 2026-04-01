"use client";
import Link from "next/link";
import { Calendar, Download, X, ChevronRight, MapPin, BedDouble, Users, Star, Moon } from "lucide-react";
import { formatDate, formatCurrency, mealPlanLabel, nightsBetween } from "@/lib/utils";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  booking: Booking;
  onCancel?: (id: number) => void;
  onDownloadInvoice?: (id: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  confirmed:   { label: "Upcoming",    bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500"  },
  checked_in:  { label: "Checked in",  bg: "bg-blue-50",     text: "text-blue-700",     dot: "bg-blue-500"     },
  checked_out: { label: "Completed",   bg: "bg-surface-100", text: "text-surface-500",  dot: "bg-surface-400"  },
  cancelled:   { label: "Cancelled",   bg: "bg-red-50",      text: "text-red-600",      dot: "bg-red-400"      },
  pending:     { label: "Pending",     bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-400"    },
  no_show:     { label: "No show",     bg: "bg-orange-50",   text: "text-orange-600",   dot: "bg-orange-400"   },
};

export default function BookingCard({ booking, onCancel, onDownloadInvoice }: Props) {
  const nights   = nightsBetween(booking.check_in_date, booking.check_out_date);
  const canCancel  = ["pending","confirmed"].includes(booking.status);
  const canInvoice = ["checked_out","checked_in"].includes(booking.status);
  const sc = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=120&h=120&fit=crop";

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row">

        {/* Image */}
        <div className="sm:w-32 shrink-0 bg-surface-100">
          <img
            src={PLACEHOLDER}
            alt="Hotel"
            className="w-full h-28 sm:h-full object-cover"
          />
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              {/* Booking ref + status */}
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-xs text-surface-400">{booking.booking_ref}</span>
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {sc.label}
                </span>
              </div>
              {/* Room type */}
              {booking.room_type && (
                <h3 className="font-bold text-navy-900 text-base leading-tight">{booking.room_type.name}</h3>
              )}
            </div>
            {/* Price */}
            <div className="text-right shrink-0">
              <p className="font-bold text-navy-900 text-lg leading-none">{formatCurrency(booking.total_amount)}</p>
              <p className="text-xs text-surface-400 mt-0.5">incl. taxes</p>
            </div>
          </div>

          {/* Date strip */}
          <div className="flex items-center gap-0 mb-3 bg-[#f2f6fa] rounded-lg overflow-hidden text-sm border border-surface-100">
            <div className="flex-1 px-3 py-2 text-center border-r border-surface-200">
              <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wide mb-0.5">Check-in</p>
              <p className="font-bold text-navy-900 text-sm">{formatDate(booking.check_in_date)}</p>
              <p className="text-[10px] text-surface-400">From 14:00</p>
            </div>
            <div className="px-3 py-2 text-center">
              <div className="flex flex-col items-center gap-0.5">
                <Moon className="w-3.5 h-3.5 text-surface-400" />
                <span className="text-xs font-bold text-navy-900">{nights}</span>
                <span className="text-[10px] text-surface-400">{nights === 1 ? "night" : "nights"}</span>
              </div>
            </div>
            <div className="flex-1 px-3 py-2 text-center border-l border-surface-200">
              <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wide mb-0.5">Check-out</p>
              <p className="font-bold text-navy-900 text-sm">{formatDate(booking.check_out_date)}</p>
              <p className="text-[10px] text-surface-400">Until 12:00</p>
            </div>
          </div>

          {/* Details row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400 mb-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {booking.adults} adult{booking.adults !== 1 ? "s" : ""}{booking.children > 0 ? ` · ${booking.children} child${booking.children > 1 ? "ren" : ""}` : ""}
            </span>
            <span className="text-surface-200">|</span>
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {mealPlanLabel(booking.meal_plan)}
            </span>
            {booking.room?.room_number && (
              <>
                <span className="text-surface-200">|</span>
                <span>Room {booking.room.room_number}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-surface-100">
            <div className="flex items-center gap-2">
              {canCancel && onCancel && (
                <button
                  onClick={() => onCancel(booking.id)}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
              {canInvoice && onDownloadInvoice && (
                <button
                  onClick={() => onDownloadInvoice(booking.id)}
                  className="flex items-center gap-1.5 text-xs text-[#0071c2] hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Invoice
                </button>
              )}
            </div>
            <Link
              href={`/guest/booking/${booking.id}`}
              className="flex items-center gap-1 text-xs font-semibold text-[#0071c2] hover:underline"
            >
              View details <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}