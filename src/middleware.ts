import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Redirect genie127.com root (and www) to /aid-agent
  const hostname = request.headers.get("host") ?? "";
  const isGeniedomain = hostname === "genie127.com" || hostname === "www.genie127.com";
  if (isGeniedomain && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/aid-agent", request.url));
  }

  const session = await verifySession(request);

  // Protected routes that require authentication
  const protectedPaths = ["/api/projects", "/api/filesystem"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};