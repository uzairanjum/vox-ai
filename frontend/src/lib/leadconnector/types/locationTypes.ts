export interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    website: string;
    timezone: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateAdded: string;
  }
  
  export interface Social {
    facebookUrl: string;
    googlePlus: string;
    linkedIn: string;
    foursquare: string;
    twitter: string;
    yelp: string;
    instagram: string;
    youtube: string;
    pinterest: string;
    blogRss: string;
    googlePlacesId: string;
  }
  
  export interface LocationInfo {
    location: Location & { social: Social };
    traceId: string;
  }
  