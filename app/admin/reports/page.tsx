"use client";
import { useState } from "react";
import { format, subDays } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import StatsCard from "@/components/ui/StatsCard";
import PageHeader from "@/components/ui/PageHeader";
import Table from "@/components/ui/Table";
import { useKPI, useDailySummary, useRevenue, useOccupancy, useArrivals } from "@/hooks/useReports";
import { formatCurrency, formatDate } from "@/lib/utils";

const HOTEL_ID = 1;
const PIE_COLORS = ["#1A3C5E", "#D4A017", "#10B981", "#E2E8F0"];

const PERIOD_TABS = [
  { label: "7 days",  value: 7  },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState(30);
  const today  = format(new Date(), "yyyy-MM-dd");
  const fromDt = format(subDays(new Date(), period), "yyyy-MM-dd");

  const { data: kpi,     isLoading: kpiLoading }  = useKPI(HOTEL_ID, period);
  const { data: daily }                            = useDailySummary(HOTEL_ID, today);
  const { data: revenue, isLoading: revLoading }   = useRevenue(HOTEL_ID, fromDt, today);
  const { data: occupancy, isLoading: occLoading } = useOccupancy(HOTEL_ID, fromDt, today);
  const { data: arrivals }                         = useArrivals(HOTEL_ID, today);

  const revenueChart = revenue?.daily?.slice(-period).map((d: any) => ({
    date:    format(new Date(d.date), "dd MMM"),
    revenue: d.revenue,
  })) ?? [];

  const occupancyChart = occupancy?.daily?.slice(-period).map((d: any) => ({
    date:    format(new Date(d.date), "dd MMM"),
    pct:     d.occupancy_pct,
  })) ?? [];

  const sourceData = revenue?.booking_sources
    ? Object.entries(revenue.booking_sources).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        value,
      }))
    : [];

  const arrivalCols = [
    { key: "booking_ref", header: "Booking Ref", render: (r: any) => <span className="font-mono text-xs font-bold">{r.booking_ref}</span> },
    { key: "guest_name",  header: "Guest" },
    { key: "phone",       header: "Phone", render: (r: any) => <span className="text-surface-400">{r.phone}</span> },
    { key: "room_number", header: "Room" },
    { key: "total_amount",header: "Total", render: (r: any) => formatCurrency(r.total_amount) },
    { key: "status",      header: "Status", render: (r: any) => (
      <span className={`badge ${r.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-surface-100 text-surface-400 border-surface-200"}`}>
        {r.status}
      </span>
    )},
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Hotel performance overview"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
        actions={
          <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
            {PERIOD_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setPeriod(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === t.value ? "bg-white text-navy-900 shadow-card" : "text-surface-400 hover:text-navy-900"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Today's live stats */}
      {daily && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Arrivals Today",    value: String(daily.arrivals?.length ?? 0),      accent: "navy"  as const },
            { label: "Departures Today",  value: String(daily.departures?.length ?? 0),    accent: "blue"  as const },
            { label: "Rooms Occupied",    value: String(daily.currently_occupied ?? 0),    accent: "green" as const },
            { label: "Occupancy %",       value: `${daily.occupancy_pct ?? 0}%`,           accent: "gold"  as const },
            { label: "Revenue Today",     value: formatCurrency(daily.revenue_today ?? 0), accent: "green" as const },
          ].map(s => (
            <StatsCard key={s.label} title={s.label} value={s.value} accent={s.accent} />
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpiLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse"><div className="h-full bg-surface-100 rounded-xl" /></div>
          ))
        ) : kpi ? ([
          { title: `Occupancy (${period}d)`, value: `${kpi.kpi.occupancy_pct}%`,           icon: "🏨", accent: "navy"  as const, sub: `${kpi.kpi.total_room_nights} room nights` },
          { title: `ADR (${period}d)`,        value: formatCurrency(kpi.kpi.adr),            icon: "💰", accent: "gold"  as const, sub: "avg daily rate" },
          { title: `RevPAR (${period}d)`,     value: formatCurrency(kpi.kpi.revpar),         icon: "📈", accent: "green" as const, sub: "rev per avail room" },
          { title: "Total Bookings",          value: String(kpi.kpi.total_bookings),         icon: "📋", accent: "blue"  as const, sub: `${kpi.kpi.cancelled_bookings} cancelled` },
        ].map(k => (
          <StatsCard key={k.title} title={k.title} value={k.value} icon={k.icon} accent={k.accent} subtitle={k.sub} />
        ))) : null}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-display font-semibold text-navy-900 mb-5">Revenue Trend</h3>
          {revLoading ? (
            <div className="h-52 skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1A3C5E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A3C5E" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgb(0 0 0/.08)", fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1A3C5E" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking sources pie */}
        <div className="card">
          <h3 className="font-display font-semibold text-navy-900 mb-5">Booking Sources</h3>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                  {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: "#64748b" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-surface-400 text-sm">No data yet</div>}
        </div>
      </div>

      {/* Occupancy bar chart */}
      <div className="card mb-8">
        <h3 className="font-display font-semibold text-navy-900 mb-5">Occupancy Rate</h3>
        {occLoading ? (
          <div className="h-44 skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={occupancyChart.filter((_: unknown, i: number) => i % Math.max(1, Math.floor(occupancyChart.length / 30)) === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, "Occupancy"]} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="pct" fill="#D4A017" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Today's arrivals/departures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-semibold text-navy-900 mb-5">
            Today's Arrivals
            {arrivals?.arrivals?.length ? (
              <span className="ml-2 badge bg-emerald-50 text-emerald-700 border-emerald-200">{arrivals.arrivals.length}</span>
            ) : null}
          </h3>
          <Table
            columns={arrivalCols}
            data={arrivals?.arrivals ?? []}
            keyExtractor={(r: any) => r.booking_ref}
            emptyTitle="No arrivals today"
            className="text-xs"
          />
        </div>
        <div className="card">
          <h3 className="font-display font-semibold text-navy-900 mb-5">
            Today's Departures
            {arrivals?.departures?.length ? (
              <span className="ml-2 badge bg-blue-50 text-blue-700 border-blue-200">{arrivals.departures.length}</span>
            ) : null}
          </h3>
          <Table
            columns={arrivalCols}
            data={arrivals?.departures ?? []}
            keyExtractor={(r: any) => r.booking_ref}
            emptyTitle="No departures today"
            className="text-xs"
          />
        </div>
      </div>
    </>
  );
}
