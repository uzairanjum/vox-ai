import { fetchGhlApi } from '@/lib/leadconnector/fetchApi';
import { PROVIDER_INFO, PROVIDER_TYPE } from '@/utils/config/provider_settings';
import { getProviderData } from '@/utils/supabase/locationTokenUtils';
import { NextRequest } from 'next/server';

interface ErrorResponse {
  success: false;
  error: string;
}

export async function GET(request: NextRequest) {
  try {
    const locationId = request.headers.get('x-location-id');

    if (!locationId) {
      return Response.json({
        success: false,
        error: 'Location ID is required'
      } satisfies ErrorResponse, { status: 400 });
    }

    const providerData = await getProviderData(PROVIDER_INFO[PROVIDER_TYPE.GHL_LOCATION].name);

    if (!providerData?.token) {
      return Response.json({
        success: false,
        error: 'No access token found'
      } satisfies ErrorResponse, { status: 401 });
    }

    const data = await fetchGhlApi(
      `/locations/${locationId}`, providerData.token
    );

    return Response.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } satisfies ErrorResponse, { status: 500 });
  }
}