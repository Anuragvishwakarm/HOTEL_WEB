export interface User {
  id: number;
  full_name: string;
  email?: string;
  phone: string;
  role: "guest" | "staff" | "hotel_admin" | "super_admin";
  is_active: boolean;
  is_verified: boolean;
  preferred_language: "en" | "hi";
  profile_photo_url?: string;
  created_at: string;
}

export interface GuestProfile {
  id: number;
  user_id: number;
  id_type?: string;
  nationality: string;
  city?: string;
  state?: string;
  loyalty_points: number;
  total_stays: number;
  is_vip: boolean;
  created_at: string;
}

export interface Hotel {
  id: number;
  name: string;
  slug: string;
  description?: string;
  star_rating: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email?: string;
  check_in_time: string;
  check_out_time: string;
  amenities?: string[];
  cover_photo_url?: string;
  total_rooms: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  min_price?: number;   // cheapest room type base_price per night
}

export interface RoomType {
  id: number;
  hotel_id: number;
  name: string;
  description?: string;
  bed_type: string;
  base_price: number;
  weekend_price?: number;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  area_sqft?: number;
  amenities?: string[];
  is_active: boolean;
}

export interface Room {
  id: number;
  hotel_id: number;
  room_type_id: number;
  room_number: string;
  floor: number;
  status: "available" | "occupied" | "maintenance" | "cleaning" | "blocked" | "inspecting";
  is_smoking: boolean;
  is_accessible: boolean;
  room_type?: RoomType;
}

export interface Booking {
  id: number;
  booking_ref: string;
  guest_user_id: number;
  hotel_id: number;
  room_id?: number;
  room_type_id: number;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string;
  actual_check_out?: string;
  adults: number;
  children: number;
  meal_plan: string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  source: string;
  room_rate_per_night: number;
  num_nights: number;
  subtotal: number;
  gst_amount: number;
  discount_amount: number;
  total_amount: number;
  special_requests?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  room_type?: RoomType;
  room?: Room;
}

export interface FolioItem {
  id: number;
  folio_id: number;
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  amount: number;
  date: string;
}

export interface Folio {
  id: number;
  booking_id: number;
  folio_number: string;
  subtotal: number;
  gst_amount: number;
  total: number;
  paid: number;
  balance: number;
  is_closed: boolean;
  items: FolioItem[];
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  method: string;
  status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  paid_at?: string;
}

export interface AvailableRoom {
  room_id:     number;
  room_number: string;
  floor:       number;
}

export interface AvailabilityResult {
  available:             boolean;
  available_rooms_count: number;
  available_rooms:       AvailableRoom[];
  hotel_id:              number;
  room_type_id:          number;
  check_in:              string;
  check_out:             string;
  num_nights:            number;
  rate_per_night:        number;
  subtotal:              number;
  gst_amount:            number;
  total_amount:          number;
}

export interface KPIData {
  hotel_id: number;
  hotel_name: string;
  period_days: number;
  from_date: string;
  to_date: string;
  total_rooms: number;
  kpi: {
    occupancy_pct: number;
    adr: number;
    revpar: number;
    total_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
    total_room_nights: number;
  };
}

export interface SearchParams {
  city?: string;
  state?: string;
  star_rating?: number;
  search?: string;
  page?: number;
  size?: number;
}