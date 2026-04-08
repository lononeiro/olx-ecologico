import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { applyCorsHeaders } from "@/lib/cors";

const protectedPagesMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const role = token?.role as string | undefined;

    if (pathname === "/dashboard" && role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    if (pathname === "/dashboard" && role === "empresa") {
      return NextResponse.redirect(new URL("/empresa", req.url));
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/empresa") && role !== "empresa") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      applyCorsHeaders(req, response.headers);
      return response;
    }

    const response = NextResponse.next();
    applyCorsHeaders(req, response.headers);
    return response;
  }

  return protectedPagesMiddleware(req);
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/admin/:path*", "/empresa/:path*"],
};
