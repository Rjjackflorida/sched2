import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const protectedRoutes = ["/", "/schedule-builder", "/faculty-portal"]
const publicRoutes = ["/login"]

export async function middleware(req) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith("/schedule-builder")
  const isPublicRoute = publicRoutes.includes(path)

  const session = await getSession()

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Redirect authenticated users away from login
  if (isPublicRoute && session) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
    return NextResponse.redirect(new URL("/faculty-portal", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
