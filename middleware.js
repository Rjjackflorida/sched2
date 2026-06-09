import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const publicRoutes = ["/login"]

export async function middleware(req) {
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)

  const session = await getSession()

  // 1. Default-Deny: Unauthenticated users are sent to login
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // 2. Authenticated users shouldn't access the login page
  if (isPublicRoute && session) {
    if (session.role === "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
    return NextResponse.redirect(new URL("/faculty-portal", req.nextUrl))
  }

  // 3. Strict Role-Based Access Control (RBAC)
  if (session) {
    const isFacultyRoute = path.startsWith("/faculty-portal")

    // Faculty members are locked tightly into their portal. 
    // They cannot access root (/), /resource-management, /user-management, etc.
    if (session.role === "faculty" && !isFacultyRoute) {
      return NextResponse.redirect(new URL("/faculty-portal", req.nextUrl))
    }

    // Admins have their own comprehensive dashboard and shouldn't route into the faculty portal directly
    if (session.role === "admin" && isFacultyRoute) {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
