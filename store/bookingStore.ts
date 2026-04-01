"use client";

import { create } from "zustand";
import type { Hotel, RoomType, AvailabilityResult } from "@/lib/types";

export interface SelectedRoom {
  room_id:     number;
  room_number: string;
  floor:       number;
}

interface BookingDraft {
  hotel:          Hotel | null;
  roomType:       RoomType | null;
  checkIn:        string;
  checkOut:       string;
  adults:         number;
  children:       number;
  mealPlan:       string;
  specialRequests:string;
  availability:   AvailabilityResult | null;
  selectedRoom:   SelectedRoom | null;
}

interface BookingStore extends BookingDraft {
  setHotel:           (hotel: Hotel) => void;
  setRoomType:        (rt: RoomType) => void;
  setDates:           (checkIn: string, checkOut: string) => void;
  setGuests:          (adults: number, children: number) => void;
  setMealPlan:        (plan: string) => void;
  setSpecialRequests: (req: string) => void;
  setAvailability:    (a: AvailabilityResult) => void;
  setSelectedRoom:    (room: SelectedRoom | null) => void;
  reset:              () => void;
}

const defaults: BookingDraft = {
  hotel: null,
  roomType: null,
  checkIn: "",
  checkOut: "",
  adults: 1,
  children: 0,
  mealPlan: "ep",
  specialRequests: "",
  availability: null,
  selectedRoom: null,
};

export const useBookingStore = create<BookingStore>((set) => ({
  ...defaults,
  setHotel:           (hotel)             => set({ hotel }),
  setRoomType:        (roomType)          => set({ roomType }),
  setDates:           (checkIn, checkOut) => set({ checkIn, checkOut }),
  setGuests:          (adults, children)  => set({ adults, children }),
  setMealPlan:        (mealPlan)          => set({ mealPlan }),
  setSpecialRequests: (specialRequests)   => set({ specialRequests }),
  setAvailability:    (availability)      => set({ availability }),
  setSelectedRoom:    (selectedRoom)      => set({ selectedRoom }),
  reset:              ()                  => set(defaults),
}));