import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { nhsApiRateLimiter } from './middleware/nhs-api-rate-limiter';

// Paths that don't require authentication
const publicPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-request",
  "/auth/error",
  "/api/auth",
];

// Paths that require super admin access
const superAdminPaths = [
  "/admin/organizations",
  "/admin/users",
  "/admin/settings",
];

// Paths that require organization admin access
const orgAdminPaths = [
  "/admin/organization",
  "/admin/pharmacies",
  "/admin/billing",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token and not on a public path, redirect to login
  if (!token) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // Check for super admin paths
  if (superAdminPaths.some(path => pathname.startsWith(path)) && token.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Check for org admin paths
  if (orgAdminPaths.some(path => pathname.startsWith(path)) &&
      token.role !== "SUPER_ADMIN" && token.role !== "ORG_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // If user has no selected pharmacy and is trying to access pharmacy-specific pages
  if (!token.selectedPharmacyId &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/select-pharmacy") &&
      !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/select-pharmacy", request.url));
  }

  // Apply rate limiting to NHS API routes
  if (pathname.startsWith('/api/eps/') || pathname.startsWith('/api/nhs/')) {
    // Determine which NHS API is being used
    let apiName = 'default';

    if (pathname.includes('/pds/') || pathname.includes('/patient/')) {
      apiName = 'pds';
    } else if (pathname.includes('/eps/') || pathname.includes('/prescription/')) {
      apiName = 'eps';
    } else if (pathname.includes('/exemption/') || pathname.includes('/pecs/')) {
      apiName = 'pecs';
    }

    // Apply rate limiting
    const rateLimitResponse = await nhsApiRateLimiter(request, apiName);

    // If rate limit is exceeded, return the response
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // Add pharmacy context to headers for API routes
  if (pathname.startsWith("/api") && token.selectedPharmacyId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pharmacy-id", token.selectedPharmacyId as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
