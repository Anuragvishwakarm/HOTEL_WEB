"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarCheck, BedDouble,
  BarChart2, Settings, ChevronRight, Users, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href: "/admin",          icon: LayoutDashboard, label: "Dashboard",  roles: ["staff","hotel_admin","super_admin"] },
  { href: "/admin/bookings", icon: CalendarCheck,   label: "Bookings",   roles: ["staff","hotel_admin","super_admin"] },
  { href: "/admin/rooms",    icon: BedDouble,       label: "Rooms",      roles: ["staff","hotel_admin","super_admin"] },
  { href: "/admin/reports",  icon: BarChart2,       label: "Reports",    roles: ["hotel_admin","super_admin"] },
  { href: "/admin/staff",    icon: Users,           label: "Staff",      roles: ["hotel_admin","super_admin"] },
  { href: "/admin/settings", icon: Settings,        label: "Settings",   roles: ["hotel_admin","super_admin"] },
];

export default function AdminSidebar() {
  const pathname  = usePathname();
  const { user }  = useAuthStore();
  const userRole  = user?.role ?? "guest";

  const visibleNav = NAV.filter(n => n.roles.includes(userRole));

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-surface-200 min-h-[calc(100vh-64px)] sticky top-16">
      <div className="p-4">
        {/* Hotel badge */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-4 bg-navy-50 rounded-xl border border-navy-100">
          <Building2 className="w-4 h-4 text-navy-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy-900 truncate">Grand Palace Hotel</p>
            <p className="text-xs text-navy-500 capitalize">{userRole.replace(/_/g," ")}</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest mb-3 px-2">
          Management
        </p>
        <nav className="space-y-1">
          {visibleNav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  active
                    ? "bg-navy-900 text-white shadow-sm"
                    : "text-surface-400 hover:text-navy-900 hover:bg-surface-50",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick stats */}
      <div className="mt-auto p-4 border-t border-surface-100">
        <p className="text-xs text-surface-400 text-center">
          {new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })}
        </p>
      </div>
    </aside>
  );
}
