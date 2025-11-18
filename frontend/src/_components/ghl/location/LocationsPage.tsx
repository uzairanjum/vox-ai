"use client";
import { LoadingIcon } from "@/_components/atoms/LoadingIcon";
import { useEffect, useState } from "react";

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  timezone: string;
  [key: string]: any;
};

type ApiResponse = {
  locations: Location[];
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/ghl/location/search", {
          method: "GET",
          credentials: "include",
          cache: "no-cache",
        });
        // console.log(res);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            `Error: ${res.status} - ${errorData.message || res.statusText}`
          );
        }

        const data: ApiResponse = await res.json();
        setLocations(data.locations); // Ensure `data.locations` is an array
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, []);

  if (loading) return <LoadingIcon/>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className=" p-6">
      <div>Location management coming soon</div>
    </div>
  );
}
