import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(request: NextRequest) {
  const session = await auth()
  
  // Если пользователь не авторизован и пытается попасть на защищенную страницу
  if (!session?.user && !request.nextUrl.pathname.startsWith('/login')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Если авторизован и пытается попасть на /login - редирект на главную
  if (session?.user && request.nextUrl.pathname === '/login') {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|docs|graphviz|login|register|verify-email|forgot-password|reset-password|.*\\.png|.*\\.webp|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.dot).*)',
  ],
}