// @ts-nocheck

import { ConversationsPage } from "@/_components/ghl/conversations/ConversationsPage";

import { getProviderData } from "@/utils/supabase/providerDataUtils";
import { PROVIDER_INFO, PROVIDER_TYPE } from "@/utils/config/provider_settings";
import { getCurrentUser } from "@/utils/supabase/supabaseUtils";
import { redirect } from "next/navigation";

export default async function ConversationsRoute() {
  // Get current user
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Get GHL provider data
  const providerData = await getProviderData(
    user.id,
    PROVIDER_INFO[PROVIDER_TYPE.GHL_LOCATION].name
  );

  if (!providerData?.data?.location_id) {
    redirect("/dashboard/app/leadconnector");
  }

  return (
    <div>
      <ConversationsPage locationId={providerData.data.location_id} />
    </div>
  );
}
