import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  MessageSquare, 
  Users, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Settings, 
  Bot, 
  Zap,
  BarChart3,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import GhlConnect from "../GhlConnect";
import { getCurrentUserProviderData } from "@/utils/providers/providerUtils";
import LocationDetails from "./location/LocationDetails";
import { getCurrentUser } from "@/utils/supabase/supabaseUtils";
import { PROVIDER_TYPE } from "@/utils/config/providerTypes";
import { fetchGhlApiWithRefresh } from "@/lib/leadconnector/fetchApi";

interface LocationStats {
  totalContacts: number;
  activeConversations: number;
  unreadMessages: number;
  autopilotEnabled: number;
}

async function getLocationStats(locationId: string, userId: string): Promise<LocationStats> {
  try {
    // Fetch real contacts count from GHL API with auto token refresh
    console.log('🔄 Fetching contacts count for location:', locationId);
    const contactsData = await fetchGhlApiWithRefresh(`/contacts/?locationId=${locationId}&limit=1`, userId);
    const totalContacts = contactsData.meta?.total || 0;

    // Fetch real conversations count from GHL API with auto token refresh
    let activeConversations = 0;
    try {
      console.log('🔄 Fetching conversations count for location:', locationId);
      const conversationsData = await fetchGhlApiWithRefresh(`/conversations/search?locationId=${locationId}&limit=1`, userId);
      activeConversations = conversationsData.meta?.total || 0;
    } catch (error) {
      console.warn('Failed to fetch conversations count:', error);
    }

    // For now, these are estimates - would need specific API endpoints for exact counts
    const unreadMessages = 0; // Would need to iterate through conversations to count unread
    const autopilotEnabled = 0; // Would need to check our autopilot_configs table

    return {
      totalContacts,
      activeConversations,
      unreadMessages,
      autopilotEnabled
    };
  } catch (error) {
    console.warn('Failed to fetch location stats:', error);
    return {
      totalContacts: 0,
      activeConversations: 0,
      unreadMessages: 0,
      autopilotEnabled: 0
    };
  }
}

export default async function LeadConnectorPage() {
  try {
    // STEP 1: Get the currently authenticated user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User is not authenticated. Redirecting to connection step.");
    }

    // STEP 2: Retrieve GHL (GoHighLevel) provider data for the user
    const providerData = await getCurrentUserProviderData(PROVIDER_TYPE.GHL_LOCATION);
    if (!providerData) {
      console.warn("No provider data found. Prompting user to connect LeadConnector.");
      return <GhlConnect />;
    }

    // STEP 3: Ensure essential credentials are present
    const locationId = providerData?.data?.location_id;
    if (!providerData?.token || !locationId) {
      console.warn("Missing location ID or access token. Prompting user to reconnect.");
      return <GhlConnect />;
    }

    // STEP 4: Fetch location details from LeadConnector API with auto token refresh
    console.log('🔄 Fetching location details for:', locationId);
    const locationInfo = await fetchGhlApiWithRefresh(`/locations/${locationId}`, user.id);
    
    // STEP 5: Get location statistics with auto token refresh
    console.log('🔄 Fetching location statistics...');
    const locationStats = await getLocationStats(locationId, user.id);

    // STEP 6: Render enhanced location dashboard
    return (
      <div className="min-h-screen p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lead Connector</h1>
            <p className="text-muted-foreground mt-1">
              Manage your LeadConnector location and conversations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
            <Button variant="outline" className="h-8 w-8 p-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Location Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {locationInfo.location?.name || 'Location Overview'}
            </CardTitle>
            <CardDescription>
              {locationInfo.location?.address || 'Your LeadConnector location details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Total Contacts
                </div>
                <div className="text-2xl font-bold">{locationStats.totalContacts.toLocaleString()}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  Active Conversations
                </div>
                <div className="text-2xl font-bold">{locationStats.activeConversations.toLocaleString()}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  Unread Messages
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {locationStats.unreadMessages > 0 ? locationStats.unreadMessages.toLocaleString() : '—'}
                </div>
                <div className="text-xs text-muted-foreground">Requires message analysis</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4" />
                  Autopilot Active
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {locationStats.autopilotEnabled > 0 ? locationStats.autopilotEnabled.toLocaleString() : '—'}
                </div>
                <div className="text-xs text-muted-foreground">Configure in conversations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a href="/dashboard/app/leadconnector/conversations" className="block">
            <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">View Conversations</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse and manage all conversations
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </a>

          <a href="/dashboard/app/ai/agents" className="block">
            <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Bot className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">AI Autopilot</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure automated AI responses
                    </p>
                  </div>
                  <Zap className="h-4 w-4 ml-auto text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </a>

          <a href="/dashboard" className="block">
            <Card className="cursor-pointer hover:bg-accent/50 transition-all hover:shadow-lg h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-semibold">Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      View conversation metrics
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Location Details */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {locationInfo.location?.name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  <p className="text-sm">{locationInfo.location.name}</p>
                </div>
              )}
              
              {locationInfo.location?.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <p className="text-sm">{locationInfo.location.address}</p>
                </div>
              )}
              
              {locationInfo.location?.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {locationInfo.location.phone}
                  </p>
                </div>
              )}
              
              {locationInfo.location?.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {locationInfo.location.email}
                  </p>
                </div>
              )}
              
              {locationInfo.location?.website && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Website</label>
                  <p className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a href={locationInfo.location.website} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      {locationInfo.location.website}
                    </a>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Connection Settings
              </CardTitle>
              <CardDescription>
                Manage your LeadConnector connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Connection Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected & Active
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Ready to sync conversations
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <GhlConnect label="Change Location" />
                <p className="text-xs text-muted-foreground mt-2">
                  Connect to a different LeadConnector location
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates from your LeadConnector location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Activity feed coming soon</p>
              <p className="text-sm mt-2">View recent messages, contacts, and system events</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error: any) {
    console.error("An error occurred while loading Lead Connector page:", error);

    // Show fallback UI with retry/connect option
    return (
      <div className="min-h-screen p-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Lead Connector</h1>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Error loading LeadConnector data</p>
              <p className="text-sm">
                {error?.message || 'Unknown error occurred while connecting to LeadConnector'}
              </p>
              <p className="text-xs text-muted-foreground">
                If the issue persists, try reconnecting your LeadConnector account below.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Offer reconnection as a recovery path */}
        <Card>
          <CardHeader>
            <CardTitle>Reconnect LeadConnector</CardTitle>
            <CardDescription>
              Connect or reconnect your LeadConnector account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GhlConnect />
          </CardContent>
        </Card>
      </div>
    );
  }
}
