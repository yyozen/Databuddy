import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicRoutes = [
  "/login",
  "/register",
  "/demo",
];

export default async function middleware(request: NextRequest) {
  const session = getSessionCookie(request);
  if (!session && !publicRoutes.includes(request.nextUrl.pathname)) {
    console.log(request.nextUrl.pathname)
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();

}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public (public files like databuddy.js)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|databuddy.js).*)",
  ],
};
