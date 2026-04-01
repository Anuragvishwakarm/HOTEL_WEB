"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, BedDouble, Users, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { reportsApi, bookingsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatCurrency } from "@/lib/utils";
import type { KPIData } from "@/lib/types";

const HOTEL_ID = 1; // In production: load from staff profile

const COLORS = ["#1A3C5E","#D4A017","#2E86AB","#e2e8f0"];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [period, setPeriod] = useState(30);

  if (!isAuthenticated || !["staff","hotel_admin","super_admin"].includes(user?.role || "")) {
    router.push("/auth/login");
    return null;
  }

  const { data: kpi, isLoading: kpiLoading } = useQuery<KPIData>({
    queryKey: ["kpi", HOTEL_ID, period],
    queryFn:  () => reportsApi.kpi(HOTEL_ID, period).then(r => r.data),
  });

  const { data: revenue, isLoading: revLoading } = useQuery<{ daily: { date: string; revenue: number }[]; booking_sources: Record<string,number> }>({
    queryKey: ["revenue", HOTEL_ID, period],
    queryFn:  () => reportsApi.revenue(HOTEL_ID).then(r => r.data),
  });

  const { data: daily } = useQuery<{ arrivals: unknown[]; departures: unknown[]; currently_occupied: number; total_rooms: number; revenue_today: number }>({
    queryKey: ["daily", HOTEL_ID],
    queryFn:  () => reportsApi.dailySummary(HOTEL_ID).then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: bookings } = useQuery({
    queryKey: ["adminBookings"],
    queryFn:  () => bookingsApi.adminAll({ hotel_id: HOTEL_ID, size: 5 }).then(r => r.data),
  });

  const kpiCards = kpi ? [
    { label: "Occupancy", value: `${kpi.kpi.occupancy_pct}%`, icon: BedDouble, color: "bg-navy-50 text-navy-600", trend: "+2.3%" },
    { label: "ADR",       value: formatCurrency(kpi.kpi.adr),  icon: DollarSign, color: "bg-gold-50 text-gold-600", trend: "+5.1%" },
    { label: "RevPAR",    value: formatCurrency(kpi.kpi.revpar), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", trend: "+3.8%" },
    { label: "Bookings",  value: kpi.kpi.total_bookings.toString(), icon: Users, color: "bg-blue-50 text-blue-600", trend: `−${kpi.kpi.cancelled_bookings} cancelled` },
  ] : [];

  const sourceData = revenue?.booking_sources
    ? Object.entries(revenue.booking_sources).map(([name, value]) => ({ name: name.replace("_"," "), value }))
    : [];

  const chartData = revenue?.daily?.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day:"2-digit", month:"short" }),
    revenue: d.revenue,
  })) || [];

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-surface-400 mt-1 text-sm">
            {daily ? `${daily.currently_occupied}/${daily.total_rooms} rooms occupied today` : "Loading…"}
          </p>
        </div>
        <div className="flex gap-2">
          {[7,30,90].map(d => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${period === d ? "bg-navy-900 text-white" : "bg-surface-100 text-surface-400 hover:text-navy-900"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Today's quick stats */}
      {daily && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-navy-900">{(daily.arrivals as unknown[]).length}</p>
            <p className="text-xs text-surface-400 mt-1">Arrivals Today</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-navy-900">{(daily.departures as unknown[]).length}</p>
            <p className="text-xs text-surface-400 mt-1">Departures Today</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-display font-bold text-emerald-600">{formatCurrency(daily.revenue_today)}</p>
            <p className="text-xs text-surface-400 mt-1">Revenue Today</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiLoading
          ? Array.from({length:4}).map((_,i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : kpiCards.map(({ label, value, icon: Icon, color, trend }) => (
              <div key={label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-surface-400 font-medium">{label}</p>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="font-display font-bold text-2xl text-navy-900">{value}</p>
                <p className="text-xs text-surface-400 mt-1">{trend} vs last period</p>
              </div>
            ))
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-navy-900 mb-5">Revenue (Last 14 days)</h3>
          {revLoading ? <Skeleton className="h-48" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1A3C5E" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1A3C5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{ borderRadius:"12px", border:"1px solid #e2e8f0", boxShadow:"0 4px 24px rgb(0 0 0/.08)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1A3C5E" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking sources pie */}
        <div className="card p-5">
          <h3 className="font-display font-semibold text-navy-900 mb-5">Booking Sources</h3>
          {sourceData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:"12px", border:"1px solid #e2e8f0" }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize:11, color:"#64748b" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <Skeleton className="h-48" />}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-navy-900">Recent Bookings</h3>
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/bookings")} className="gap-1 text-sm">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                {["Booking Ref","Guest","Check-in","Check-out","Amount","Status"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium text-surface-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(bookings as { id: number; booking_ref: string; guest_user?: { full_name: string }; check_in_date: string; check_out_date: string; total_amount: number; status: string }[] || []).map(b => (
                <tr key={b.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs font-semibold text-navy-900">{b.booking_ref}</td>
                  <td className="py-3 px-3">{b.guest_user?.full_name || "—"}</td>
                  <td className="py-3 px-3 text-surface-400">{b.check_in_date}</td>
                  <td className="py-3 px-3 text-surface-400">{b.check_out_date}</td>
                  <td className="py-3 px-3 font-medium">{formatCurrency(b.total_amount)}</td>
                  <td className="py-3 px-3">
                    <span className={`badge ${
                      b.status==="confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      b.status==="checked_in" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      b.status==="cancelled" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-surface-100 text-surface-400 border-surface-200"
                    }`}>
                      {b.status.replace(/_/g," ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
