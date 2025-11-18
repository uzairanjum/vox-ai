// @ts-nocheck
import { getSupabase } from './getSupabase';

import { UserProfile } from '@/app/profile/actions/profile';

export async function fetchUserProfile() {
    const supabase = await getSupabase();

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            throw new Error('Not authenticated');
        }

        const { data, error } = await supabase
            .from('user_profile')
            .select('*')
            .eq('user_id_auth', user.id)
            .single();

        if (error) {
            throw error;
        }

        return {
            user,
            profile: data as UserProfile
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const supabase = await getSupabase();

    try {
        const { error } = await supabase
            .from('user_profile')
            .update(updates)
            .eq('user_id_auth', userId);

        if (error) {
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

export async function getCurrentUser() {
    const supabase = await getSupabase();
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            throw error;
        }

        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        throw error;
    }
}
