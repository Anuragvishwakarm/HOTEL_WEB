import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelsApi } from "@/lib/api";
import type { Hotel, RoomType, Room, SearchParams } from "@/lib/types";
import toast from "react-hot-toast";

// ── Hotel queries ─────────────────────────────────────────────────────────────

export function useHotels(params: SearchParams = {}) {
  return useQuery<Hotel[]>({
    queryKey: ["hotels", params],
    queryFn:  () => hotelsApi.list(params).then(r => r.data),
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

export function useRooms(hotelId: number | null, params?: Record<string, unknown>) {
  return useQuery<Room[]>({
    queryKey: ["rooms", hotelId, params],
    queryFn:  () => hotelsApi.getRooms(hotelId!, params).then(r => r.data),
    enabled:  !!hotelId,
    refetchInterval: 60_000,
  });
}

// ── Hotel mutations ───────────────────────────────────────────────────────────

export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => hotelsApi.create(data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      toast.success("Hotel created successfully.");
    },
    onError: () => toast.error("Failed to create hotel."),
  });
}

export function useUpdateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      hotelsApi.update(id, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["hotel", id] });
      qc.invalidateQueries({ queryKey: ["hotels"] });
      toast.success("Hotel updated.");
    },
    onError: () => toast.error("Failed to update hotel."),
  });
}

export function useCreateRoomType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, data }: { hotelId: number; data: unknown }) =>
      hotelsApi.createRoomType(hotelId, data).then(r => r.data),
    onSuccess: (_, { hotelId }) => {
      qc.invalidateQueries({ queryKey: ["roomTypes", hotelId] });
      toast.success("Room type created.");
    },
    onError: () => toast.error("Failed to create room type."),
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, data }: { hotelId: number; data: unknown }) =>
      hotelsApi.createRoom(hotelId, data).then(r => r.data),
    onSuccess: (_, { hotelId }) => {
      qc.invalidateQueries({ queryKey: ["rooms", hotelId] });
      toast.success("Room added.");
    },
    onError: () => toast.error("Failed to add room."),
  });
}

export function useUpdateRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, status, hotelId }: { roomId: number; status: string; hotelId: number }) =>
      hotelsApi.updateRoomStatus(roomId, status).then(r => r.data),
    onSuccess: (_, { hotelId }) => {
      qc.invalidateQueries({ queryKey: ["rooms", hotelId] });
      toast.success("Room status updated.");
    },
    onError: () => toast.error("Failed to update room status."),
  });
}
