import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/sign-in", "/sign-up","/geofencing","/livelocation","/routeplanning", "/createtripid"];

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();

  // Protect all routes not listed as public
  if (!publicRoutes.includes(req.nextUrl.pathname) && !userId) {
    // ✅ Don't mutate req, always return a new redirect response
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ✅ Always return something
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"], // exclude _next/* and static files
};
