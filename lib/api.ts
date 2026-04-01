import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = Cookies.get("refresh_token");
      if (!refreshToken) {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        setTokens(data.access_token, data.refresh_token);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── ✅ FIXED: setTokens — secure:true hata diya (localhost pe kaam nahi karta)
// path:"/" add kiya — middleware sab routes pe cookie dekh sake
// sameSite:"lax" — middleware cookie read kar sake
export function setTokens(accessToken: string, refreshToken: string) {
  Cookies.set("access_token", accessToken, {
    expires: 1,         // 1 din
    path: "/",          // sabhi routes pe available
    sameSite: "lax",    // middleware read kar sake
  });
  Cookies.set("refresh_token", refreshToken, {
    expires: 7,         // 7 din
    path: "/",
    sameSite: "lax",
  });
}

export function clearAuth() {
  Cookies.remove("access_token",  { path: "/" });
  Cookies.remove("refresh_token", { path: "/" });
}

export function getAccessToken() {
  return Cookies.get("access_token");
}

// ── Typed API helpers ─────────────────────────────────────────────────────────

export const authApi = {
  register:    (d: unknown) => api.post("/auth/register", d),
  login:       (d: unknown) => api.post("/auth/login", d),
  sendOTP:     (phone: string) => api.post("/auth/send-otp", { phone }),
  verifyOTP:   (d: unknown)  => api.post("/auth/verify-otp", d),
  me:          () => api.get("/auth/me"),
  logout:      () => api.post("/auth/logout"),
};

export const hotelsApi = {
  list:             (params: unknown) => api.get("/hotels/", { params }),
  get:              (id: number)      => api.get(`/hotels/${id}`),
  create:           (d: unknown)      => api.post("/hotels/", d),
  update:           (id: number, d: unknown) => api.patch(`/hotels/${id}`, d),
  getRoomTypes:     (id: number)      => api.get(`/hotels/${id}/room-types`),
  createRoomType:   (id: number, d: unknown) => api.post(`/hotels/${id}/room-types`, d),
  getRooms:         (id: number, params?: unknown) => api.get(`/hotels/${id}/rooms`, { params }),
  createRoom:       (id: number, d: unknown) => api.post(`/hotels/${id}/rooms`, d),
  updateRoomStatus: (roomId: number, status: string) =>
    api.patch(`/hotels/rooms/${roomId}/status`, null, { params: { new_status: status } }),
};

export const bookingsApi = {
  create:            (d: unknown)  => api.post("/bookings/", d),
  myBookings:        (params?: unknown) => api.get("/bookings/my", { params }),
  checkAvailability: (params: unknown) => api.get("/bookings/availability", { params }),
  get:               (id: number)  => api.get(`/bookings/${id}`),
  getByRef:          (ref: string) => api.get(`/bookings/ref/${ref}`),
  cancel:            (id: number, reason?: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  checkin:           (id: number, roomId?: number) =>
    api.post(`/bookings/${id}/checkin`, null, { params: { room_id: roomId } }),
  checkout:          (id: number) => api.post(`/bookings/${id}/checkout`),
  getFolio:          (id: number) => api.get(`/bookings/${id}/folio`),
  addCharge:         (id: number, d: unknown) => api.post(`/bookings/${id}/folio/add-charge`, d),
  adminAll:          (params?: unknown) => api.get("/bookings/admin/all", { params }),
};

export const paymentsApi = {
  initiate:      (bookingId: number) => api.post("/payments/initiate", { booking_id: bookingId }),
  verify:        (d: unknown)        => api.post("/payments/verify", d),
  cash:          (d: unknown)        => api.post("/payments/cash", d),
  getInvoiceUrl: (bookingId: number) => `${BASE_URL}/payments/invoice/${bookingId}`,
  summary:       (bookingId: number) => api.get(`/payments/summary/${bookingId}`),
  history:       (bookingId: number) => api.get(`/payments/booking/${bookingId}`),
  refund:        (d: unknown)        => api.post("/payments/refund", d),
};

export const reportsApi = {
  dailySummary:    (hotelId: number, date?: string) =>
    api.get("/reports/daily-summary", { params: { hotel_id: hotelId, report_date: date } }),
  occupancy:       (hotelId: number, params?: unknown) =>
    api.get("/reports/occupancy", { params: { hotel_id: hotelId, ...params as object } }),
  revenue:         (hotelId: number, params?: unknown) =>
    api.get("/reports/revenue", { params: { hotel_id: hotelId, ...params as object } }),
  kpi:             (hotelId: number, days?: number) =>
    api.get("/reports/kpi", { params: { hotel_id: hotelId, period_days: days } }),
  arrivalsDeparts: (hotelId: number, date?: string) =>
    api.get("/reports/arrivals-departures", { params: { hotel_id: hotelId, report_date: date } }),
};

export const usersApi = {
  me:                 () => api.get("/users/me"),
  updateMe:           (d: unknown) => api.patch("/users/me", d),
  getGuestProfile:    () => api.get("/users/me/guest-profile"),
  updateGuestProfile: (d: unknown) => api.put("/users/me/guest-profile", d),
};