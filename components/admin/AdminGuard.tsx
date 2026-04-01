"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

type AllowedRole = "staff" | "hotel_admin" | "super_admin";

interface Props {
  children: React.ReactNode;
  minRole?: AllowedRole;
}

const ROLE_RANK: Record<string, number> = {
  guest: 0, staff: 1, hotel_admin: 2, super_admin: 3,
};

export default function AdminGuard({ children, minRole = "staff" }: Props) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    const userRank = ROLE_RANK[user?.role ?? "guest"] ?? 0;
    const minRank  = ROLE_RANK[minRole] ?? 1;
    if (userRank < minRank) {
      router.push("/");
    }
  }, [isAuthenticated, user, minRole, router]);

  if (!isAuthenticated) return null;
  const userRank = ROLE_RANK[user?.role ?? "guest"] ?? 0;
  const minRank  = ROLE_RANK[minRole] ?? 1;
  if (userRank < minRank) return null;

  return <>{children}</>;
}
