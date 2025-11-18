import { getSupabase } from '../supabase/getSupabase';
import { getCurrentUser } from '../supabase/supabaseUtils';
import { PROVIDER_TYPE } from '../config/providerTypes';

export interface ProviderData {
  name: string;
  type: PROVIDER_TYPE;
  token: string;
  refresh?: string | null;
  expires?: string | null;
  data?: Record<string, any> | null;
}

export async function getProviderData(userId: string, type: PROVIDER_TYPE): Promise<ProviderData | null> {
  try {
    const supabase = await getSupabase();
    
    // Get provider data
    const { data, error } = await supabase
      .from('provider_data')
      .select('*')
      .eq('auth_provider_id', userId)
      .eq('type', type);

    // Handle no data found case
    if (error || !data || data.length === 0) {
      if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
        console.error('Error fetching provider data:', error);
      }
      return null;
    }

    // Return the first matching provider
    return data[0] as ProviderData;
  } catch (error) {
    console.error('Error in getProviderData:', error);
    return null;
  }
}

export async function getCurrentUserProviderData(type: PROVIDER_TYPE): Promise<ProviderData | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getProviderData(user.id, type);
}