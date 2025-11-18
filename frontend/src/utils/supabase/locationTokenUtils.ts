// @ts-nocheck

import { type Provider } from '@/app/profile/actions/profile';
import { getSupabase } from './getSupabase';
import { PROVIDER } from '@/_components/ghl/constants';

export interface LocationToken {
    location_id: string;
    token: string;
    provider_name: string;
    user_type?: string;
    company_id?: string;
    user_id?: string;
}

export async function saveLocationToken(locationToken: LocationToken, userId: string) {
    try {
        const supabase = await getSupabase();
        
        console.log('Saving token for user:', userId);
        // console.log('Token data:', locationToken);

        // First get the current profile
        const { data: profile, error: fetchError } = await supabase
            .from('user_profile')
            .select('providers')
            .eq('user_id_auth', userId)
            .single();

        if (fetchError) {
            console.error('Error fetching profile:', fetchError);
            throw fetchError;
        }

        console.log('Current profile:', profile);

        // Parse the providers array from JSON
        let providers = [];
        if (profile?.providers) {
            try {
                if (typeof profile.providers === 'string') {
                    providers = JSON.parse(profile.providers);
                } else if (Array.isArray(profile.providers)) {
                    providers = profile.providers.map(p =>
                        typeof p === 'string' ? JSON.parse(p) : p
                    );
                }
            } catch (e) {
                console.error('Error parsing providers:', e);
                throw e;
            }
        }

        console.log('Current providers after parsing:', providers);
        
        // Remove any existing provider of the same type
        const filteredProviders = providers.filter((p: any) =>
            p?.provider_name !== PROVIDER.name
        );
        
        // Add new provider to array
        const updatedProviders = [
            ...filteredProviders,
            {
                provider_name: PROVIDER.name,
                provider_type: PROVIDER.type,
                location_id: locationToken.location_id,
                token: locationToken.token,
                user_type: locationToken.user_type,
                company_id: locationToken.company_id,
                user_id: locationToken.user_id
            }
        ];

        console.log('Saving providers:', updatedProviders);

        // Save updated providers to the profile
        const { error: updateError } = await supabase
            .from('user_profile')
            .update({ providers: updatedProviders })
            .eq('user_id_auth', userId);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            throw updateError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error in saveLocationToken:', error);
        throw error;
    }
}

export async function getLocationToken(userId: string): Promise<Provider | null> {
    try {
        const supabase = await getSupabase();
        
        const { data: profile, error } = await supabase
            .from('user_profile')
            .select('providers')
            .eq('user_id_auth', userId)
            .single();

        if (error) {
            console.error('Error fetching location token:', error);
            return null;
        }

        // Parse the providers array from JSON
        let providers = [];
        if (profile?.providers) {
            try {
                if (typeof profile.providers === 'string') {
                    providers = JSON.parse(profile.providers);
                } else if (Array.isArray(profile.providers)) {
                    providers = profile.providers.map(p => typeof p === 'string' ? JSON.parse(p) : p);
                }
            } catch (e) {
                console.error('Error parsing providers:', e);
                return null;
            }
        }

        const provider = providers.find((p: any) => p?.provider_name === PROVIDER.name) as Provider | undefined;
        return provider || null;
    } catch (error) {
        console.error('Error in getLocationToken:', error);
        return null;
    }
}

export async function getProviderData(userId: string, providerName: string = 'ghl'): Promise<Provider | null> {
    try {
        console.log('Getting provider data for user:', userId, 'provider:', providerName);
        
        const supabase = await getSupabase();
        
        const { data: profile, error } = await supabase
            .from('user_profile')
            .select('providers')
            .eq('user_id_auth', userId)
            .single();

        if (error) {
            console.error('Error fetching provider data:', error);
            return null;
        }

        console.log('Found profile:', profile.providers[0].name);

        // Parse the providers array from JSON
        let providers = [];
        if (profile?.providers) {
            try {
                // If it's a string, parse it to get the array
                if (typeof profile.providers === 'string') {
                    providers = JSON.parse(profile.providers);
                } else if (Array.isArray(profile.providers)) {
                    // If it's already an array, parse any stringified objects within it
                    providers = profile.providers.map(p => typeof p === 'string' ? JSON.parse(p) : p);
                }
            } catch (e) {
                console.error('Error parsing providers:', e);
                return null;
            }
        }

        console.log('Parsed providers:', providers);
        
        // Find the matching provider
        const provider = providers.find((p: any) => p?.provider_name === PROVIDER.name) as Provider | undefined;
        console.log('Found provider:', provider);
        return provider || null;
    } catch (error) {
        console.error('Error in getProviderData:', error);
        return null;
    }
}

export async function removeLocationToken(userId: string, providerName: string = 'ghl') {
    try {
        const supabase = await getSupabase();
        
        // First get the current profile
        const { data: profile, error: fetchError } = await supabase
            .from('user_profile')
            .select('providers')
            .eq('user_id_auth', userId)
            .single();

        if (fetchError) {
            console.error('Error fetching profile:', fetchError);
            throw fetchError;
        }

        // Parse the providers array from JSON
        let providers = [];
        if (profile?.providers) {
            try {
                if (typeof profile.providers === 'string') {
                    providers = JSON.parse(profile.providers);
                } else if (Array.isArray(profile.providers)) {
                    providers = profile.providers.map(p =>
                        typeof p === 'string' ? JSON.parse(p) : p
                    );
                }
            } catch (e) {
                console.error('Error parsing providers:', e);
                return { success: false, error: 'Failed to parse providers' };
            }
        }

        console.log('Current providers after parsing:', providers);

        // Filter out the specified provider
        const updatedProviders = providers.filter((p: any) =>
            p?.provider_name !== PROVIDER.name
        );

        // Update the profile
        const { error: updateError } = await supabase
            .from('user_profile')
            .update({ providers: updatedProviders })
            .eq('user_id_auth', userId);

        if (updateError) {
            console.error('Error updating profile:', updateError);
            throw updateError;
        }

        return { success: true };
    } catch (error) {
        console.error('Error in removeLocationToken:', error);
        throw error;
    }
}
