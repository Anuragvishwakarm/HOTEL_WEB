import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingsApi, paymentsApi } from "@/lib/api";
import type { Booking, Folio } from "@/lib/types";
import toast from "react-hot-toast";

// ── Booking queries ───────────────────────────────────────────────────────────

export function useMyBookings(status?: string, page = 1, size = 10) {
  const params = status ? { booking_status: status, page, size } : { page, size };
  return useQuery<Booking[]>({
    queryKey: ["myBookings", status, page],
    queryFn:  () => bookingsApi.myBookings(params).then(r => r.data),
    staleTime: 30_000,
  });
}

export function useBooking(id: number | null) {
  return useQuery<Booking>({
    queryKey: ["booking", id],
    queryFn:  () => bookingsApi.get(id!).then(r => r.data),
    enabled:  !!id,
  });
}

export function useBookingByRef(ref: string | null) {
  return useQuery<Booking>({
    queryKey: ["booking", "ref", ref],
    queryFn:  () => bookingsApi.getByRef(ref!).then(r => r.data),
    enabled:  !!ref,
  });
}

export function useAllBookings(params: {
  hotel_id?: number;
  booking_status?: string;
  check_in_from?: string;
  check_in_to?: string;
  search?: string;
  page?: number;
  size?: number;
}) {
  return useQuery<Booking[]>({
    queryKey: ["adminBookings", params],
    queryFn:  () => bookingsApi.adminAll(params).then(r => r.data),
    staleTime: 20_000,
  });
}

export function useFolio(bookingId: number | null) {
  return useQuery<Folio>({
    queryKey: ["folio", bookingId],
    queryFn:  () => bookingsApi.getFolio(bookingId!).then(r => r.data),
    enabled:  !!bookingId,
  });
}

export function useAvailability(params: {
  hotel_id: number;
  room_type_id: number;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
} | null) {
  return useQuery({
    queryKey: ["availability", params],
    queryFn:  () => bookingsApi.checkAvailability(params!).then(r => r.data),
    enabled:  !!params && !!params.check_in && !!params.check_out,
    retry: false,
  });
}

// ── Booking mutations ─────────────────────────────────────────────────────────

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => bookingsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      bookingsApi.cancel(id, reason).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["myBookings"] });
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
      qc.invalidateQueries({ queryKey: ["booking", id] });
      toast.success("Booking cancelled.");
    },
    onError: () => toast.error("Could not cancel booking."),
  });
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: number; roomId?: number }) =>
      bookingsApi.checkin(id, roomId).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
      qc.invalidateQueries({ queryKey: ["booking", data.id] });
      toast.success(`Guest checked in — ${data.booking_ref}`);
    },
    onError: () => toast.error("Check-in failed."),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.checkout(id).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
      qc.invalidateQueries({ queryKey: ["booking", data.id] });
      toast.success(`Guest checked out — ${data.booking_ref}`);
    },
    onError: () => toast.error("Check-out failed."),
  });
}

export function useAddFolioCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: unknown }) =>
      bookingsApi.addCharge(bookingId, data).then(r => r.data),
    onSuccess: (_, { bookingId }) => {
      qc.invalidateQueries({ queryKey: ["folio", bookingId] });
      toast.success("Charge added to folio.");
    },
    onError: () => toast.error("Failed to add charge."),
  });
}

// ── Payment mutations ─────────────────────────────────────────────────────────

export function useRecordCashPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => paymentsApi.cash(data).then(r => r.data),
    onSuccess: (_, vars: any) => {
      qc.invalidateQueries({ queryKey: ["folio", vars.booking_id] });
      toast.success("Payment recorded.");
    },
    onError: () => toast.error("Failed to record payment."),
  });
}
