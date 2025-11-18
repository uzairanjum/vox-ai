// utils/supabase/route-handler-client.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function getSupabaseRouteHandler() {
  const cookieStore = cookies() // ✅ no await
  return createRouteHandlerClient({ 
    cookies: () => cookieStore 
  })
}

export async function getCurrentUserFromRequest() {
  try {
    const supabase = getSupabaseRouteHandler()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Auth error in route handler:', error)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Unexpected error in route handler:', error)
    return null
  }
}
