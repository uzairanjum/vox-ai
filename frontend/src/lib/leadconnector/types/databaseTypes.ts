export interface GhlData {
    scope: string;
    userId: string;
    userType: string;
    companyId: string;
    expires_in: number;
    locationId: string;
    token_type: string;
    refresh_token: string;
    access_token: string;
}

export interface LeadConnectorPageProps {
    id: string;
    created_at: string;
    name: string;
    type: number;
    token: string;
    refresh: string;
    expires: string;
    data: GhlData | null;
    provider_id_ref: string;
    auth_provider_id: string;
}