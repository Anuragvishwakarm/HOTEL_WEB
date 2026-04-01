"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { authApi, setTokens, clearAuth } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login:       (phone: string, password: string) => Promise<void>;
  loginOTP:    (phone: string, otp: string, fullName?: string) => Promise<void>;
  register:    (data: RegisterData) => Promise<void>;
  logout:      () => Promise<void>;
  fetchMe:     () => Promise<void>;
  setUser:     (user: User) => void;
}

interface RegisterData {
  full_name: string;
  phone: string;
  password: string;
  email?: string;
  preferred_language?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (phone, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.login({ phone, password });
          setTokens(data.access_token, data.refresh_token);
          const { data: user } = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      loginOTP: async (phone, otp, fullName) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.verifyOTP({ phone, otp, full_name: fullName });
          setTokens(data.access_token, data.refresh_token);
          const { data: user } = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.register(formData);
          setTokens(data.access_token, data.refresh_token);
          const { data: user } = await authApi.me();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try { await authApi.logout(); } catch (_) {}
        clearAuth();
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        const token = Cookies.get("access_token");
        if (!token) { set({ isAuthenticated: false }); return; }
        try {
          const { data: user } = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch (_) {
          clearAuth();
          set({ user: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: true }),
    }),
    {
      name: "hotel-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
