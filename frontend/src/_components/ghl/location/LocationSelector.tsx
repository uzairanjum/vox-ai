"use client";
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/_components/atoms/ConfirmationModal";

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  timezone: string;
};

type Props = {
  locations: Location[];
};

const LocationSelector: React.FC<Props> = ({ locations }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const router = useRouter();

  // Filter locations based on search query
  const filteredLocations = useMemo(
    () =>
      locations.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [locations, searchQuery]
  );

  // Handle location selection
  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location); // Store the selected location
    setShowDialog(true); // Open the confirmation modal
  };

  // Handle confirmation
  const handleConfirmSelection = async () => {
    try {
      if (selectedLocation) {
        // Send the location ID to the backend
        await fetch("/api/oauth/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId: selectedLocation.id }),
        });

        // Wait for 2 seconds before redirecting
        setTimeout(() => {
          router.push("/app/locations/d/calendars");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error selecting location:", error.message);
    } finally {
      setShowDialog(false); // Close the modal
    }
  };

  // Handle cancellation
  const handleCancelSelection = () => {
    setShowDialog(false); // Close the modal
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Select a Location</h2>

      {/* Search Input */}
      <Input
        type="text"
        placeholder="Search locations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Location List */}
      <ScrollArea className="h-[800px] rounded-md border p-4">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => (
            <div
              key={location.id}
              className="flex justify-between items-center py-2 px-4 hover:bg-gray-50 cursor-pointer text-sm"
              onClick={() => handleSelectLocation(location)} // Open modal on click
            >
              <div className="flex flex-col">
                <span className="font-medium">{location.name}</span>
                <span className="text-gray-500 text-xs">
                  {location.address}, {location.city}, {location.state}
                </span>
              </div>
              <span className="text-gray-500 text-xs">{location.timezone}</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No locations found.</p>
        )}
      </ScrollArea>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDialog}
        onClose={handleCancelSelection}
        onConfirm={handleConfirmSelection}
        title="Confirm Location"
        description={`Are you sure you want to select the location: ${selectedLocation?.name}?`}
      />
    </div>
  );
};

export default LocationSelector;
