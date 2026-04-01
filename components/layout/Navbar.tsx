"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, LayoutDashboard, Building2, Globe, ChevronDown, Bell, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin   = user?.role === "hotel_admin" || user?.role === "super_admin";
  const isStaff   = user?.role === "staff";
  const isOnAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleLogout() {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
    setProfileOpen(false);
  }

  // Admin panel uses different navbar style
  if (isOnAdmin) {
    return (
      <header className="sticky top-0 z-50 bg-[#003580] border-b border-[#00246b]">
        <div className="page-container h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FFC107] rounded-lg flex items-center justify-center">
              <span className="text-[#003580] text-xs font-black">H</span>
            </div>
            <span className="font-bold text-white text-sm">HotelBook <span className="text-[#FFC107]">Admin</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-300 hover:text-white text-xs transition-colors">← Guest site</Link>
            {isAuthenticated && (
              <div className="flex items-center gap-2 bg-[#00246b] rounded-lg px-3 py-1.5">
                <div className="w-5 h-5 bg-[#FFC107] rounded-full flex items-center justify-center">
                  <span className="text-[#003580] text-[10px] font-black">{user?.full_name?.charAt(0)}</span>
                </div>
                <span className="text-white text-xs font-medium">{user?.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-[#003580] shadow-md">
      <div className="page-container h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#003580] text-xs font-black">H</span>
          </div>
          <span className="font-bold text-white text-base hidden sm:block">HotelBook</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/",              label: "Stays" },
            { href: "/guest/search",  label: "Search Hotels" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                pathname === href
                  ? "border-white text-white"
                  : "border-transparent text-blue-200 hover:text-white hover:border-white/40"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Currency / Language (decorative) */}
          <button className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 text-sm transition-colors">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">INR</span>
            <span className="text-xs">🇮🇳</span>
          </button>
          <button className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 text-sm transition-colors">
            <span className="text-xs font-medium">EN</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Notification bell */}
              <button className="hidden sm:flex p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors relative">
                <Bell className="w-4 h-4" />
              </button>

              {/* Profile dropdown */}
              <div ref={profileRef} className="relative ml-1">
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full pl-1.5 pr-3 py-1.5 transition-colors"
                >
                  <div className="w-6 h-6 bg-[#FFC107] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[#003580] text-[11px] font-black">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-white text-xs font-medium max-w-[100px] truncate">
                    {user?.full_name?.split(" ")[0]}
                  </span>
                  <ChevronDown className={cn("w-3 h-3 text-white/70 transition-transform", profileOpen && "rotate-180")} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-surface-200 shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 bg-[#003580]">
                      <p className="text-sm font-bold text-white">{user?.full_name}</p>
                      <p className="text-xs text-blue-300 mt-0.5">{user?.phone}</p>
                      {user?.email && <p className="text-xs text-blue-300">{user?.email}</p>}
                    </div>

                    <div className="py-1">
                      {[
                        { href: "/guest/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "My Bookings" },
                        { href: "/guest/profile",   icon: <User className="w-4 h-4" />,            label: "Account" },
                        ...(isAdmin || isStaff ? [{ href: "/admin", icon: <Building2 className="w-4 h-4" />, label: "Admin Panel" }] : []),
                      ].map(({ href, icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-900 hover:bg-blue-50 transition-colors"
                        >
                          <span className="text-surface-400">{icon}</span>
                          {label}
                        </Link>
                      ))}
                      <hr className="my-1 border-surface-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/register"
                className="hidden sm:block text-sm font-semibold text-white hover:underline transition-colors px-2 py-2"
              >
                Register
              </Link>
              <Link
                href="/auth/login"
                className="bg-white text-[#003580] text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                Sign in
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden ml-1 p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#003580] border-t border-white/10 pb-3">
          {[
            { href: "/",              label: "🏠 Home" },
            { href: "/guest/search",  label: "🔍 Search Hotels" },
            ...(isAuthenticated ? [
              { href: "/guest/dashboard", label: "📋 My Bookings" },
              { href: "/guest/profile",   label: "👤 Account" },
            ] : [
              { href: "/auth/login",    label: "Sign in" },
              { href: "/auth/register", label: "Register" },
            ]),
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block px-6 py-3 text-sm text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              {label}
            </Link>
          ))}
          {isAuthenticated && (
            <button onClick={handleLogout} className="block w-full text-left px-6 py-3 text-sm text-red-300 hover:bg-white/10 transition-colors">
              🚪 Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}