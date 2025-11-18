// src/middleware.ts
import { type NextRequest } from 'next/server'
import { middleware as supabaseMiddleware } from '@/utils/supabase/middleware' // Rename the import

export async function middleware(request: NextRequest) {
  return await supabaseMiddleware(request) // Use the renamed import
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}