import { cache } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabase } from '../supabase/getSupabase';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Auth error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Unexpected error:', error);
    return null;
  }
});
