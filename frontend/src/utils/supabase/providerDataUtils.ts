// @ts-nocheck

import { getSupabase } from './getSupabase';

export interface ProviderData {
    name: string;
    type: number;
    token: string;
    refresh?: string;
    expires?: string;
    data?: Record<string, any>;
}

export async function saveProviderData(
    userId: string,
    profileId: string, 
    providerData: ProviderData
) {
    try {
        const supabase = await getSupabase();
        
        // Check for existing provider data
        const { data: existing, error: fetchError } = await supabase
            .from('provider_data')
            .select('*')
            .eq('auth_provider_id', userId)
            .eq('name', providerData.name)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Error fetching provider data:', fetchError);
            throw fetchError;
        }

        if (existing) {
            // Update existing provider data
            const { error: updateError } = await supabase
                .from('provider_data')
                .update({
                    token: providerData.token,
                    refresh: providerData.refresh,
                    expires: providerData.expires,
                    data: providerData.data || {}
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('Error updating provider data:', updateError);
                throw updateError;
            }
        } else {
            // Insert new provider data
            const { error: insertError } = await supabase
                .from('provider_data')
                .insert({
                    auth_provider_id: userId,
                    provider_id_ref: profileId,
                    name: providerData.name,
                    type: providerData.type,
                    token: providerData.token,
                    refresh: providerData.refresh,
                    expires: providerData.expires,
                    data: providerData.data || {}
                });

            if (insertError) {
                console.error('Error inserting provider data:', insertError);
                throw insertError;
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error in saveProviderData:', error);
        throw error;
    }
}

export async function getProviderData(userId: string, name: string) {
    try {
        const supabase = await getSupabase();
        
        const { data, error } = await supabase
            .from('provider_data')
            .select('*')
            .eq('auth_provider_id', userId)
            .eq('name', name)
            .single();

        if (error) {
            console.error('Error fetching provider data:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getProviderData:', error);
        return null;
    }
}

export async function removeProviderData(userId: string, name: string) {
    try {
        const supabase = await getSupabase();
        
        const { error } = await supabase
            .from('provider_data')
            .delete()
            .eq('auth_provider_id', userId)
            .eq('name', name);

        if (error) {
            console.error('Error removing provider data:', error);
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error in removeProviderData:', error);
        throw error;
    }
}