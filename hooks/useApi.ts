"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  hotelsApi, bookingsApi, paymentsApi, reportsApi, usersApi, authApi,
} from "@/lib/api";
import type { Hotel, RoomType, Booking, Folio, SearchParams } from "@/lib/types";
import toast from "react-hot-toast";

// ── Hotels ────────────────────────────────────────────────────────────────────

export function useHotels(params?: SearchParams) {
  return useQuery<Hotel[]>({
    queryKey:  ["hotels", params],
    queryFn:   () => hotelsApi.list(params).then(r => r.data),
    staleTime: 60_000,
  });
}

export function useHotel(id: number | null) {
  return useQuery<Hotel>({
    queryKey: ["hotel", id],
    queryFn:  () => hotelsApi.get(id!).then(r => r.data),
    enabled:  !!id,
  });
}

export function useRoomTypes(hotelId: number | null) {
  return useQuery<RoomType[]>({
    queryKey: ["roomTypes", hotelId],
    queryFn:  () => hotelsApi.getRoomTypes(hotelId!).then(r => r.data),
    enabled:  !!hotelId,
  });
}

export function useRooms(hotelId: number | null, status?: string) {
  return useQuery({
    queryKey: ["rooms", hotelId, status],
    queryFn:  () => hotelsApi.getRooms(hotelId!, status ? { status } : undefined).then(r => r.data),
    enabled:  !!hotelId,
  });
}

// ── Availability ──────────────────────────────────────────────────────────────

export function useAvailability(params: {
  hotel_id: number; room_type_id: number;
  check_in: string; check_out: string;
  adults: number; children: number;
} | null) {
  return useQuery({
    queryKey: ["availability", params],
    queryFn:  () => bookingsApi.checkAvailability(params!).then(r => r.data),
    enabled:  !!params,
    retry:    false,
  });
}

// ── Bookings ──────────────────────────────────────────────────────────────────

export function useMyBookings(status?: string) {
  return useQuery<Booking[]>({
    queryKey: ["myBookings", status],
    queryFn:  () => bookingsApi.myBookings(status ? { booking_status: status } : undefined).then(r => r.data),
  });
}

export function useBooking(id: number | null) {
  return useQuery<Booking>({
    queryKey: ["booking", id],
    queryFn:  () => bookingsApi.get(id!).then(r => r.data),
    enabled:  !!id,
  });
}

export function useAdminBookings(params?: object) {
  return useQuery<Booking[]>({
    queryKey: ["adminBookings", params],
    queryFn:  () => bookingsApi.adminAll(params).then(r => r.data),
  });
}

export function useFolio(bookingId: number | null) {
  return useQuery<Folio>({
    queryKey: ["folio", bookingId],
    queryFn:  () => bookingsApi.getFolio(bookingId!).then(r => r.data),
    enabled:  !!bookingId,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => bookingsApi.create(data).then(r => r.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["myBookings"] }),
    onError:    (e: any) => toast.error(e?.response?.data?.detail ?? "Booking failed"),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      bookingsApi.cancel(id, reason).then(r => r.data),
    onSuccess:  () => {
      toast.success("Booking cancelled.");
      qc.invalidateQueries({ queryKey: ["myBookings"] });
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Cancellation failed"),
  });
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roomId }: { id: number; roomId?: number }) =>
      bookingsApi.checkin(id, roomId).then(r => r.data),
    onSuccess: () => {
      toast.success("Guest checked in.");
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Check-in failed"),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingsApi.checkout(id).then(r => r.data),
    onSuccess: () => {
      toast.success("Guest checked out.");
      qc.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Check-out failed"),
  });
}

export function useAddFolioCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: number; data: object }) =>
      bookingsApi.addCharge(bookingId, data).then(r => r.data),
    onSuccess: (_data, vars) => {
      toast.success("Charge added.");
      qc.invalidateQueries({ queryKey: ["folio", vars.bookingId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Could not add charge"),
  });
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function usePaymentSummary(bookingId: number | null) {
  return useQuery({
    queryKey: ["paymentSummary", bookingId],
    queryFn:  () => paymentsApi.summary(bookingId!).then(r => r.data),
    enabled:  !!bookingId,
  });
}

export function usePaymentHistory(bookingId: number | null) {
  return useQuery({
    queryKey: ["payments", bookingId],
    queryFn:  () => paymentsApi.history(bookingId!).then(r => r.data),
    enabled:  !!bookingId,
  });
}

export function useRecordCashPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => paymentsApi.cash(data).then(r => r.data),
    onSuccess: (_d, vars: any) => {
      toast.success("Payment recorded.");
      qc.invalidateQueries({ queryKey: ["paymentSummary", vars.booking_id] });
      qc.invalidateQueries({ queryKey: ["folio", vars.booking_id] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail ?? "Payment failed"),
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useKPI(hotelId: number, days = 30) {
  return useQuery({
    queryKey: ["kpi", hotelId, days],
    queryFn:  () => reportsApi.kpi(hotelId, days).then(r => r.data),
  });
}

export function useRevenue(hotelId: number, params?: object) {
  return useQuery({
    queryKey: ["revenue", hotelId, params],
    queryFn:  () => reportsApi.revenue(hotelId, params).then(r => r.data),
  });
}

export function useOccupancy(hotelId: number, params?: object) {
  return useQuery({
    queryKey: ["occupancy", hotelId, params],
    queryFn:  () => reportsApi.occupancy(hotelId, params).then(r => r.data),
  });
}

export function useDailySummary(hotelId: number, date?: string) {
  return useQuery({
    queryKey: ["dailySummary", hotelId, date],
    queryFn:  () => reportsApi.dailySummary(hotelId, date).then(r => r.data),
    refetchInterval: 60_000,
  });
}

export function useArrivalsDeparts(hotelId: number, date?: string) {
  return useQuery({
    queryKey: ["arrivalsDeparts", hotelId, date],
    queryFn:  () => reportsApi.arrivalsDeparts(hotelId, date).then(r => r.data),
  });
}

// ── User / Profile ────────────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn:  () => usersApi.me().then(r => r.data),
  });
}

export function useGuestProfile() {
  return useQuery({
    queryKey: ["guestProfile"],
    queryFn:  () => usersApi.getGuestProfile().then(r => r.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => usersApi.updateMe(data).then(r => r.data),
    onSuccess:  () => { toast.success("Profile updated."); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError:    () => toast.error("Failed to update profile"),
  });
}

export function useUpdateGuestProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => usersApi.updateGuestProfile(data).then(r => r.data),
    onSuccess:  () => { toast.success("Profile saved."); qc.invalidateQueries({ queryKey: ["guestProfile"] }); },
    onError:    () => toast.error("Failed to save profile"),
  });
}

// ── Hotel CRUD (admin) ────────────────────────────────────────────────────────

export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => hotelsApi.create(data).then(r => r.data),
    onSuccess:  () => { toast.success("Hotel created."); qc.invalidateQueries({ queryKey: ["hotels"] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.detail ?? "Create failed"),
  });
}

export function useUpdateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => hotelsApi.update(id, data).then(r => r.data),
    onSuccess:  (_d, v) => { toast.success("Hotel updated."); qc.invalidateQueries({ queryKey: ["hotel", v.id] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.detail ?? "Update failed"),
  });
}

export function useCreateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, data }: { hotelId: number; data: object }) =>
      hotelsApi.createRoomType(hotelId, data).then(r => r.data),
    onSuccess:  (_d, v) => { toast.success("Room type created."); qc.invalidateQueries({ queryKey: ["roomTypes", v.hotelId] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.detail ?? "Create failed"),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, data }: { hotelId: number; data: object }) =>
      hotelsApi.createRoom(hotelId, data).then(r => r.data),
    onSuccess:  (_d, v) => { toast.success("Room added."); qc.invalidateQueries({ queryKey: ["rooms", v.hotelId] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.detail ?? "Create failed"),
  });
}

export function useUpdateRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: number; status: string; hotelId: number }) =>
      hotelsApi.updateRoomStatus(roomId, status).then(r => r.data),
    onSuccess:  (_d, v) => { toast.success(`Room status → ${v.status}`); qc.invalidateQueries({ queryKey: ["rooms", v.hotelId] }); },
    onError:    () => toast.error("Status update failed"),
  });
}
