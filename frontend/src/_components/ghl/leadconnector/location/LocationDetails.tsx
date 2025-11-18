import { LocationInfo } from "@/lib/leadconnector/types/locationTypes";
import React from "react";


const LocationDetails: React.FC<{ locationInfo: LocationInfo }> = ({ locationInfo }) => {
  const { location } = locationInfo;

  return (
    <div className="bg-card p-4 rounded-lg border">
      <h3 className="font-medium mb-2">Location Details</h3>
      <div className="space-y-2 text-sm">
        <p><strong>ID:</strong> {location.id}</p>
        <p><strong>Name:</strong> {location.name}</p>
        <p><strong>Address:</strong> {`${location.address}, ${location.city}, ${location.state}, ${location.country} ${location.postalCode}`}</p>
        <p><strong>Website:</strong> <a href={location.website} target="_blank" rel="noopener noreferrer">{location.website}</a></p>
        <p><strong>Timezone:</strong> {location.timezone}</p>
        <p><strong>Contact:</strong> {`${location.firstName} ${location.lastName} (${location.email}, ${location.phone})`}</p>
        <p><strong>Date Added:</strong> {new Date(location.dateAdded).toLocaleString()}</p>
        <p><strong>Social Links:</strong></p>
        <ul className="pl-4">
          {Object.entries(location.social).map(([key, value]) => value && (
            <li key={key}>
              <a href={value} target="_blank" rel="noopener noreferrer">{key}: {value}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LocationDetails;