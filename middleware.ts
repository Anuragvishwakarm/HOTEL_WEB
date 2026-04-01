import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS  = ["/", "/auth/login", "/auth/register", "/guest/search"];
const ADMIN_PATHS   = ["/admin"];
const GUEST_PATHS   = ["/guest/dashboard", "/guest/profile", "/guest/booking"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken  = request.cookies.get("access_token")?.value;

  // Protect guest-only pages
  const needsAuth = GUEST_PATHS.some(p => pathname.startsWith(p));
  if (needsAuth && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Allow public pages and hotel detail
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/guest/dashboard/:path*",
    "/guest/profile/:path*",
    "/guest/booking/:path*",
    "/admin/:path*",
  ],
};
