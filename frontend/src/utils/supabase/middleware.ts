// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Create Supabase client for middleware (Edge-compatible)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Sync cookie access for Edge runtime
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the response for Edge runtime
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // Refresh the session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.warn("Middleware auth error:", error);
      // Continue without session - let individual routes handle auth
      return response;
    }

    const { pathname } = request.nextUrl;

    // Define protected routes
    const protectedRoutes = ["/dashboard", "/profile", "/settings", "/app"];

    // Define auth routes (where logged-in users shouldn't go)
    const authRoutes = [
      "/auth/login",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    // Check if current route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Check if current route is auth route
    const isAuthRoute =
      authRoutes.includes(pathname) || pathname.startsWith("/auth/");

    // Redirect to login if accessing protected route without session
    if (isProtectedRoute && !session) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(url);
    }

    // Redirect to dashboard if accessing auth route with active session
    if (isAuthRoute && session) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, allow the request to proceed
    // Individual route handlers should have their own auth checks
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (unless you want to protect them too)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
