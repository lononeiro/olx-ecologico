import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const role = token?.role as string | undefined;

    // Redireciona para o dashboard correto após login
    if (pathname === "/dashboard" && role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (pathname === "/dashboard" && role === "empresa") {
      return NextResponse.redirect(new URL("/empresa", req.url));
    }

    // Protege rotas de admin
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protege rotas de empresa
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

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/empresa/:path*"],
};
