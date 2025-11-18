"use server";

import { fetchGhlApiWithRefresh } from '@/lib/leadconnector/fetchApi';
import { getCurrentUser } from "@/utils/supabase/supabaseUtils";
import { getCurrentUserProviderData } from "@/utils/providers/providerUtils";
import { PROVIDER_TYPE } from "@/utils/config/providerTypes";

export const getConversations = async () => {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get GHL provider data from database instead of cookies
    const providerData = await getCurrentUserProviderData(PROVIDER_TYPE.GHL_LOCATION);
    if (!providerData) {
      throw new Error("No LeadConnector connection found. Please connect your LeadConnector account first.");
    }

    // Extract location ID from provider data
    const locationId = providerData?.data?.location_id;
    if (!locationId) {
      throw new Error("Location ID not found in provider data. Please reconnect your LeadConnector account.");
    }

    console.log('🔄 Fetching conversations for location:', locationId);

    // Use enhanced fetchGhlApiWithRefresh with proper parameters
    const conversations = await fetchGhlApiWithRefresh(
      `/conversations/search?locationId=${locationId}&limit=10&sort=desc&sortBy=last_message_date`,
      user.id
    );
    
    console.log('✅ Conversations fetched successfully:', {
      count: conversations?.conversations?.length || 0,
      total: conversations?.total || 0
    });
    
    return conversations;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    throw error; // Propagate error for proper error handling
  }
};
