"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, TrendingUp } from "lucide-react";
import BookingCard from "@/components/booking/BookingCard";
import { BookingCardSkeleton } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { bookingsApi, paymentsApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Booking, GuestProfile } from "@/lib/types";
import toast from "react-hot-toast";

const STATUS_TABS = [
  { key: "all",         label: "All" },
  { key: "confirmed",   label: "Upcoming" },
  { key: "checked_in",  label: "Active" },
  { key: "checked_out", label: "Past" },
  { key: "cancelled",   label: "Cancelled" },
];

export default function DashboardPage() {
  const router       = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const qc           = useQueryClient();
  const [activeTab, setActiveTab]       = useState("all");
  const [cancelId, setCancelId]         = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  if (!isAuthenticated) { router.push("/auth/login?redirect=/guest/dashboard"); return null; }

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["myBookings", activeTab],
    queryFn:  () => bookingsApi.myBookings(activeTab !== "all" ? { booking_status: activeTab } : undefined).then(r => r.data),
  });

  const { data: profile } = useQuery<GuestProfile>({
    queryKey: ["guestProfile"],
    queryFn:  () => usersApi.getGuestProfile().then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => bookingsApi.cancel(id, reason),
    onSuccess: () => {
      toast.success("Booking cancelled.");
      qc.invalidateQueries({ queryKey: ["myBookings"] });
      setCancelId(null); setCancelReason("");
    },
    onError: () => toast.error("Could not cancel booking. Please try again."),
  });

  function handleDownloadInvoice(bookingId: number) {
    const url = paymentsApi.getInvoiceUrl(bookingId);
    const token = document.cookie.split(";").find(c => c.trim().startsWith("access_token="))?.split("=")[1];
    const a = document.createElement("a");
    a.href = `${url}?access_token=${token}`;
    a.download = `invoice_${bookingId}.pdf`;
    a.click();
    toast.success("Downloading invoice…");
  }

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">My Bookings</h1>
          <p className="text-surface-400 mt-1">Welcome back, {user?.full_name?.split(" ")[0]}</p>
        </div>

        {/* Stats */}
        {profile && (
          <div className="flex gap-4">
            <div className="card px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-gold-50 rounded-xl flex items-center justify-center">
                <Star className="w-4 h-4 text-gold-500" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Loyalty Points</p>
                <p className="font-display font-semibold text-navy-900">{profile.loyalty_points}</p>
              </div>
            </div>
            <div className="card px-5 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-navy-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-navy-600" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Total Stays</p>
                <p className="font-display font-semibold text-navy-900">{profile.total_stays}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-2xl w-fit mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? "bg-white text-navy-900 shadow-card"
                : "text-surface-400 hover:text-navy-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {isLoading ? (
        <div className="space-y-4">{Array.from({length:4}).map((_,i)=><BookingCardSkeleton key={i} />)}</div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="font-display text-xl font-semibold text-navy-900 mb-2">No bookings yet</h3>
          <p className="text-surface-400 mb-6">Your stays will appear here once you make a booking.</p>
          <Button onClick={() => router.push("/guest/search")}>Find Hotels</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={(id) => setCancelId(id)}
              onDownloadInvoice={handleDownloadInvoice}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Booking" size="sm">
        <p className="text-surface-400 text-sm mb-4">
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>
        <textarea
          className="input min-h-[80px] resize-none mb-5"
          placeholder="Reason for cancellation (optional)"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
        />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setCancelId(null)}>Keep Booking</Button>
          <Button
            variant="danger"
            fullWidth
            loading={cancelMutation.isPending}
            onClick={() => cancelId && cancelMutation.mutate({ id: cancelId, reason: cancelReason })}
          >
            Cancel Booking
          </Button>
        </div>
      </Modal>
    </div>
  );
}
