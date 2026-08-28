import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const responseHeaders = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cross-origin-opener-policy": "same-origin",
  };
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      .trim();
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      .trim();
    const publicHost = forwardedHost || request.headers.get("host");
    const publicOrigin = publicHost
      ? (forwardedProto || request.nextUrl.protocol.replace(":", "")) +
        "://" +
        publicHost
      : request.nextUrl.origin;
    const originMismatch =
      origin &&
      fetchSite !== "same-origin" &&
      origin !== request.nextUrl.origin &&
      origin !== publicOrigin;
    if (fetchSite === "cross-site" || originMismatch)
      return NextResponse.json(
        { error: "Cross-site request blocked." },
        { status: 403, headers: responseHeaders },
      );
  }
  if (request.nextUrl.pathname === "/admin/login")
    return NextResponse.redirect(new URL("/admin-login", request.url), {
      headers: responseHeaders,
    });
  const hasSession = Boolean(request.cookies.get("securepathshield_session")?.value);
  if (request.nextUrl.pathname === "/admin-login") {
    const response = NextResponse.next();
    Object.entries(responseHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  }
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    Object.entries(responseHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  }
  if (!hasSession) {
    const login = request.nextUrl.pathname.startsWith("/admin")
      ? "/admin-login"
      : "/login";
    return NextResponse.redirect(new URL(login, request.url));
  }
  const headers = new Headers(request.headers);
  headers.set("x-securepathshield-protected", "1");
  const response = NextResponse.next({ request: { headers } });
  Object.entries(responseHeaders).forEach(([key, value]) =>
    response.headers.set(key, value),
  );
  return response;
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/admin-login",
    "/api/:path*",
  ],
};
