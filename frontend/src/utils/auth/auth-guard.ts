import { redirect } from "next/navigation";
import { getSupabase } from "../supabase/getSupabase";
import { User } from '@supabase/supabase-js';

/**
 * Protects a route by requiring authentication.
 * Redirects to login if user is not authenticated.
 */
export async function protectRoute(redirectTo: string = '/auth/login'): Promise<User> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      redirect(redirectTo);
    }

    return user;
  } catch (error) {
    // Only log non-redirect errors
    if (!(error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      console.error('Auth error:', error);
    }
    redirect(redirectTo);
  }
}

/**
 * Redirects to dashboard if user is already authenticated.
 * Used on login/signup pages to prevent authenticated users from accessing them.
 */
export async function redirectIfAuthenticated(redirectTo: string = '/dashboard/profile'): Promise<void> {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Silently return on auth error - user is not authenticated
      return;
    }

    if (user) {
      // User is authenticated, redirect to dashboard
      redirect(redirectTo);
    }
  } catch (error) {
    // Only log non-redirect errors
    if (!(error instanceof Error && error.message.includes('NEXT_REDIRECT'))) {
      console.error('Auth error:', error);
    }
  }
}