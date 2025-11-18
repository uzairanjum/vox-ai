"use server"

import { getSupabase } from "@/utils/supabase/getSupabase"
import { getProfile as getProfileServer } from "@/app/profile/actions/profile"
import type { UserProfile } from "@/app/profile/actions/profile"

// Re-export the server-side profile function
export { getProfileServer as getProfile }

export async function updateProfile(updates: Partial<UserProfile>) {
  try {
    const supabase = await getSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("Not authenticated")
    }

    const { error } = await supabase
      .from('user_profile')
      .update(updates as never)
      .eq('user_id_auth', user.id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("Profile update error:", error)
    throw error
  }
}

export async function deleteProfile() {
  try {
    const supabase = await getSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("Not authenticated")
    }

    const { error } = await supabase
      .from('user_profile')
      .delete()
      .eq('user_id_auth', user.id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("Profile deletion error:", error)
    throw error
  }
}
