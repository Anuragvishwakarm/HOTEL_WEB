import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";

export function useKPI(hotelId: number, days = 30) {
  return useQuery({
    queryKey: ["kpi", hotelId, days],
    queryFn:  () => reportsApi.kpi(hotelId, days).then(r => r.data),
    staleTime: 60_000,
    enabled:  !!hotelId,
  });
}

export function useDailySummary(hotelId: number, date?: string) {
  return useQuery({
    queryKey: ["dailySummary", hotelId, date],
    queryFn:  () => reportsApi.dailySummary(hotelId, date).then(r => r.data),
    refetchInterval: 60_000,
    enabled:  !!hotelId,
  });
}

export function useOccupancy(hotelId: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ["occupancy", hotelId, from, to],
    queryFn:  () => reportsApi.occupancy(hotelId, { from_date: from, to_date: to }).then(r => r.data),
    enabled:  !!hotelId,
    staleTime: 120_000,
  });
}

export function useRevenue(hotelId: number, from?: string, to?: string) {
  return useQuery({
    queryKey: ["revenue", hotelId, from, to],
    queryFn:  () => reportsApi.revenue(hotelId, { from_date: from, to_date: to }).then(r => r.data),
    enabled:  !!hotelId,
    staleTime: 120_000,
  });
}

export function useArrivals(hotelId: number, date?: string) {
  return useQuery({
    queryKey: ["arrivals", hotelId, date],
    queryFn:  () => reportsApi.arrivalsDeparts(hotelId, date).then(r => r.data),
    refetchInterval: 60_000,
    enabled:  !!hotelId,
  });
}
