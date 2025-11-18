import { useCallback, useEffect, useState } from 'react';

interface Location {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  customerId?: string;
}

interface UseLocationProps {
  locationId: string;
}

interface UseLocationReturn {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  fetchLocation: () => Promise<void>;
}

export function useLocation({ locationId }: UseLocationProps): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!locationId) {
      setError('Location ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leadconnector/location', {
        headers: {
          'x-location-id': locationId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }

      const data = await response.json();
      setLocation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  // Initial fetch
  useEffect(() => {
    if (locationId) {
      fetchLocation();
    }
  }, [locationId, fetchLocation]);

  return {
    location,
    isLoading,
    error,
    fetchLocation,
  };
}