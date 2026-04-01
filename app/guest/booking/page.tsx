"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, ChevronRight, BedDouble, Calendar, Users, Receipt } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useBookingStore } from "@/store/bookingStore";
import { useAuthStore } from "@/store/authStore";
import { bookingsApi } from "@/lib/api";
import { formatCurrency, formatDate, mealPlanLabel, nightsBetween, gstRate } from "@/lib/utils";
import { useRazorpay } from "@/hooks/useRazorpay";
import type { Booking } from "@/lib/types";
import toast from "react-hot-toast";

const STEPS = ["Review", "Details", "Payment", "Done"];

const detailsSchema = z.object({
  special_requests: z.string().optional(),
  meal_plan: z.enum(["ep","cp","map","ap","ai"]),
});
type DetailsForm = z.infer<typeof detailsSchema>;

const MEAL_PLANS = [
  { value: "ep",  label: "Room Only (EP)" },
  { value: "cp",  label: "With Breakfast (CP)" },
  { value: "map", label: "Half Board (MAP)" },
  { value: "ap",  label: "Full Board (AP)" },
];

export default function BookingPage() {
  const router  = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const store   = useBookingStore();
  const { pay } = useRazorpay();

  const [step, setStep]         = useState(0);
  const [booking, setBooking]   = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { meal_plan: "ep" },
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login?redirect=/guest/booking"); return; }
    if (!store.hotel || !store.roomType) { router.push("/guest/search"); }
  }, [isAuthenticated, store.hotel, store.roomType, router]);

  if (!store.hotel || !store.roomType || !store.availability) {
    return <div className="page-container py-20 text-center text-surface-400">Loading booking details…</div>;
  }

  const { hotel, roomType, checkIn, checkOut, adults, children, availability } = store;
  const nights = nightsBetween(checkIn, checkOut);

  async function onSubmitDetails(values: DetailsForm) {
    setCreating(true);
    try {
      const { data } = await bookingsApi.create({
        hotel_id:          hotel!.id,
        room_type_id:      roomType!.id,
        check_in_date:     checkIn,
        check_out_date:    checkOut,
        adults, children,
        meal_plan:         values.meal_plan,
        special_requests:  values.special_requests,
        preferred_room_id: store.selectedRoom?.room_id ?? undefined,
      });
      setBooking(data);
      setStep(2);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Booking failed. Please try again.";
      toast.error(msg);
    } finally { setCreating(false); }
  }

  function handlePayment() {
    if (!booking) return;
    pay({
      bookingId:  booking.id,
      guestName:  user?.full_name,
      guestEmail: user?.email,
      guestPhone: user?.phone,
      onSuccess: () => {
        setStep(3);
        store.reset();
      },
      onFailure: () => toast.error("Payment failed. Your booking is saved — you can pay later from My Bookings."),
    });
  }

  return (
    <div className="page-container py-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${
              i < step  ? "bg-emerald-500 text-white" :
              i === step ? "bg-navy-900 text-white" : "bg-surface-100 text-surface-400"
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`hidden sm:block ml-2 text-sm font-medium ${i === step ? "text-navy-900" : "text-surface-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-12 sm:w-16 h-0.5 mx-3 ${i < step ? "bg-emerald-400" : "bg-surface-200"}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Step 0: Review */}
          {step === 0 && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-6">Review Your Selection</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-navy-50 rounded-2xl border border-navy-100">
                  <BedDouble className="w-5 h-5 text-navy-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-navy-900">{roomType.name}</p>
                    <p className="text-sm text-surface-400">{hotel.name}, {hotel.city}</p>
                    {store.selectedRoom && (
                      <p className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                        <span className="text-emerald-500">✓</span>
                        Room {store.selectedRoom.room_number} · Floor {store.selectedRoom.floor}
                      </p>
                    )}
                    {!store.selectedRoom && (
                      <p className="text-xs text-amber-600 mt-1">Auto-assign (no specific room chosen)</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface-50 rounded-2xl border border-surface-200">
                  <Calendar className="w-5 h-5 text-surface-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-navy-900">{formatDate(checkIn)} → {formatDate(checkOut)}</p>
                    <p className="text-sm text-surface-400">{nights} {nights === 1 ? "night" : "nights"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface-50 rounded-2xl border border-surface-200">
                  <Users className="w-5 h-5 text-surface-400 mt-0.5 shrink-0" />
                  <p className="font-medium text-navy-900">{adults} Adults{children > 0 ? `, ${children} Children` : ""}</p>
                </div>
              </div>
              <Button fullWidth className="mt-6" onClick={() => setStep(1)}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Guest details */}
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitDetails)} className="card p-6 animate-fade-up">
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-6">Booking Details</h2>
              <div className="p-4 bg-surface-50 rounded-2xl border border-surface-200 mb-6">
                <p className="text-sm font-medium text-navy-900">{user?.full_name}</p>
                <p className="text-sm text-surface-400">{user?.phone}{user?.email ? ` · ${user.email}` : ""}</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-navy-900 block mb-2">Meal Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_PLANS.map(mp => (
                      <label key={mp.value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        watch("meal_plan") === mp.value ? "border-navy-900 bg-navy-50" : "border-surface-200 hover:border-navy-200"
                      }`}>
                        <input type="radio" value={mp.value} {...register("meal_plan")} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          watch("meal_plan") === mp.value ? "border-navy-900 bg-navy-900" : "border-surface-300"
                        }`}>
                          {watch("meal_plan") === mp.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm font-medium text-navy-900">{mp.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Input
                  label="Special Requests (optional)"
                  placeholder="e.g. High floor, non-smoking room, late check-in..."
                  {...register("special_requests")}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" onClick={() => setStep(0)} type="button">← Back</Button>
                <Button fullWidth loading={creating} type="submit">Confirm Booking</Button>
              </div>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && booking && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-display text-xl font-semibold text-navy-900 mb-2">Payment</h2>
              <p className="text-surface-400 text-sm mb-6">Booking confirmed! Complete payment to guarantee your room.</p>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Booking #{booking.booking_ref}</p>
                  <p className="text-xs text-emerald-600">Your room is reserved. Pay now to confirm.</p>
                </div>
              </div>

              <Button fullWidth variant="gold" className="text-base gap-2 h-12" onClick={handlePayment}>
                Pay {formatCurrency(booking.total_amount)} via Razorpay
              </Button>
              <p className="text-center text-xs text-surface-400 mt-3">
                Powered by Razorpay · UPI, Card, Net Banking accepted · Secure & encrypted
              </p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="card p-8 text-center animate-fade-up">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-navy-900 mb-2">All Set! 🎉</h2>
              <p className="text-surface-400 mb-4">Your booking is confirmed and payment received.</p>
              <div className="bg-surface-50 rounded-2xl border border-surface-200 p-4 mb-6 text-left max-w-sm mx-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Booking Ref</span>
                  <span className="font-mono font-bold text-navy-900">{booking?.booking_ref}</span>
                </div>
                {store.selectedRoom && (
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">Room Assigned</span>
                    <span className="font-semibold text-emerald-700">Room {store.selectedRoom.room_number} · Floor {store.selectedRoom.floor}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400">Hotel</span>
                  <span className="font-medium text-navy-900">{hotel?.name}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="secondary" onClick={() => router.push("/guest/dashboard")}>My Bookings</Button>
                <Button onClick={() => router.push("/")}>Book Another Stay</Button>
              </div>
            </div>
          )}
        </div>

        {/* Price summary sidebar */}
        <aside className="lg:col-span-2">
          <div className="card p-5 sticky top-24">
            <h3 className="font-display font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4" /> Price Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-surface-400">
                <span>{formatCurrency(availability.rate_per_night)} × {nights} nights</span>
                <span>{formatCurrency(availability.subtotal)}</span>
              </div>
              <div className="flex justify-between text-surface-400">
                <span>GST ({gstRate(availability.rate_per_night)}%)</span>
                <span>{formatCurrency(availability.gst_amount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-navy-900 text-base pt-3 border-t border-surface-100">
                <span>Total</span>
                <span>{formatCurrency(availability.total_amount)}</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-surface-100 text-xs text-surface-400 space-y-1">
              <p>✓ Free cancellation on select rooms</p>
              <p>✓ GST invoice provided at checkout</p>
              <p>✓ 24/7 front desk support</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}