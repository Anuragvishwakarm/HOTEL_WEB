"use client";
import { useCallback } from "react";
import { paymentsApi } from "@/lib/api";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: new (opts: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface UseRazorpayOptions {
  bookingId: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  onSuccess?: (bookingId: number) => void;
  onFailure?: () => void;
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export function useRazorpay() {
  const pay = useCallback(async ({ bookingId, guestName, guestEmail, guestPhone, onSuccess, onFailure }: UseRazorpayOptions) => {
    const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!loaded) { toast.error("Payment gateway could not be loaded. Check your connection."); return; }

    const toastId = toast.loading("Initialising payment…");

    try {
      const { data: order } = await paymentsApi.initiate(bookingId);
      toast.dismiss(toastId);

      const rzp = new window.Razorpay({
        key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount:      order.amount_paise,
        currency:    order.currency,
        name:        "HotelBook",
        description: `Booking: ${order.booking_ref}`,
        order_id:    order.razorpay_order_id,
        prefill:     { name: guestName, email: guestEmail, contact: guestPhone },
        theme:       { color: "#1A3C5E" },
        modal:       { ondismiss: () => { toast("Payment cancelled."); onFailure?.(); } },
        handler: async (response: RazorpayResponse) => {
          const verifyId = toast.loading("Verifying payment…");
          try {
            await paymentsApi.verify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            toast.dismiss(verifyId);
            toast.success("Payment successful!");
            onSuccess?.(bookingId);
          } catch {
            toast.dismiss(verifyId);
            toast.error("Payment verification failed. Contact support.");
            onFailure?.();
          }
        },
      });
      rzp.open();
    } catch {
      toast.dismiss(toastId);
      toast.error("Could not initiate payment. Please try again.");
      onFailure?.();
    }
  }, []);

  return { pay };
}
