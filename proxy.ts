import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Публичные пути, доступные без авторизации
// NB: используем суффикс '/' для префикс-матчинга папки, чтобы не зацепить похожие пути (например, /schedule)
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/sched/']

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path))
}

export async function proxy(request: NextRequest) {
  const session = await auth()
  const pathname = request.nextUrl.pathname
  
  // Проверяем валидность сессии (должен быть user с id)
  const isValidSession = session?.user && (session.user as any).id
  
  // Если пользователь не авторизован и пытается попасть на защищенную страницу
  if (!isValidSession && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    // Сохраняем URL для редиректа после логина
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Если авторизован и пытается попасть на публичную страницу авторизации
  if (isValidSession && isPublicPath(pathname)) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|docs|graphviz|schemas|sched|login|register|verify-email|forgot-password|reset-password|.*\\.png|.*\\.webp|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico|.*\\.dot|.*\\.xml).*)',
  ],
}