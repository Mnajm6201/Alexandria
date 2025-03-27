// middleware.js
import { NextResponse } from "next/server";

// Define protected routes
const protectedRoutes = ["/bookclubs", "/profile", "/shelf"];

export function middleware(req) {
  const path = req.nextUrl.pathname;
  console.log(`Middleware running for path: ${path}`);

  // Check if the path is protected
  const isProtected = protectedRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for your auth cookies
  const accessToken = req.cookies.get("access_token");
  const hasAccessToken = !!accessToken;

  console.log(`Protected route. Has access token: ${hasAccessToken}`);

  if (!hasAccessToken) {
    console.log("No access token, redirecting to home");
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
