import { ConversationDetails } from "@/_components/ghl/conversations/ConversationDetails";
import { getCurrentUserProviderData } from "@/utils/providers/providerUtils";
import { PROVIDER_TYPE } from "@/utils/config/providerTypes";
import { notFound } from "next/navigation";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    contact?: string;
    email?: string;
    phone?: string;
    tag?: string;
  }>;
}

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const { id } = await params;
  const { contact, email, phone, tag } = await searchParams;

  // Get provider data to get location ID
  const providerData = await getCurrentUserProviderData(
    PROVIDER_TYPE.GHL_LOCATION
  );
  if (!providerData?.data?.location_id) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ConversationDetails
          conversationId={id}
          tag={tag || ""}
          locationId={providerData.data.location_id}
        />
      </div>
    </div>
  );
}
