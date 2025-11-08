import { auth } from "@/lib/auth"
import type { NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  return auth(request as any)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|verify-email|forgot-password|reset-password).*)',
  ],
}
