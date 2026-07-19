import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isProtected = pathname.startsWith("/videos") || pathname.startsWith("/admin");

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && isLoggedIn && !req.auth?.user?.isAdmin) {
    const videosUrl = new URL("/videos", req.nextUrl.origin);
    return NextResponse.redirect(videosUrl);
  }
});

export const config = {
  matcher: ["/videos/:path*", "/admin/:path*"],
};
