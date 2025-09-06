import { apiFetch } from './client';
import { API_BASE_URL } from './routes';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  address: string;
  coordinates: Coordinates;
  formatted_address: string;
  place_id: string;
  types: string[];
}

export interface DirectionsResult {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  steps: {
    instruction: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
  }[];
  polyline: string;
}

export interface Place {
  name: string;
  place_id: string;
  rating: number;
  vicinity: string;
  types: string[];
  geometry: {
    location: Coordinates;
  };
  photos?: any[];
}

export interface TripDistanceResult {
  totalDistance: {
    text: string;
    value: number;
  };
  totalDuration: {
    text: string;
    value: number;
  };
  segments: {
    from: Coordinates;
    to: Coordinates;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
  }[];
}

export interface ItineraryMapData {
  destination: string;
  locations: {
    day: number;
    date: string;
    locations: {
      address: string;
      coordinates: Coordinates;
      formatted_address: string;
      place_id: string;
      types: string[];
      activity: string;
      timeSlot: string;
      day: number;
    }[];
  }[];
  routes: {
    day: number;
    from: any;
    to: any;
    route: DirectionsResult;
  }[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
}

// Geocode an address to get coordinates
export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  return apiFetch<GeocodeResult>(`${API_BASE_URL}/api/maps/geocode`, {
    method: 'POST',
    body: { address }
  });
};

// Get directions between two points
export const getDirections = async (
  origin: Coordinates, 
  destination: Coordinates, 
  mode: string = 'driving'
): Promise<DirectionsResult> => {
  return apiFetch<DirectionsResult>(`${API_BASE_URL}/api/maps/directions`, {
    method: 'POST',
    body: { origin, destination, mode }
  });
};

// Get nearby places
export const getNearbyPlaces = async (
  location: Coordinates, 
  type: string = 'tourist_attraction', 
  radius: number = 5000
): Promise<{ places: Place[] }> => {
  return apiFetch<{ places: Place[] }>(`${API_BASE_URL}/api/maps/nearby`, {
    method: 'POST',
    body: { location, type, radius }
  });
};

// Get place details by place ID
export const getPlaceDetails = async (placeId: string): Promise<any> => {
  return apiFetch<any>(`${API_BASE_URL}/api/maps/place/${placeId}`);
};

// Calculate trip distance and duration
export const calculateTripDistance = async (
  locations: Coordinates[], 
  mode: string = 'driving'
): Promise<TripDistanceResult> => {
  return apiFetch<TripDistanceResult>(`${API_BASE_URL}/api/maps/trip-distance`, {
    method: 'POST',
    body: { locations, mode }
  });
};

// Generate map data for a trip itinerary
export const getTripItineraryMap = async (
  tripId: string, 
  itinerary: any
): Promise<ItineraryMapData> => {
  return apiFetch<ItineraryMapData>(`${API_BASE_URL}/api/maps/trip/${tripId}/itinerary-map`, {
    method: 'POST',
    body: { itinerary }
  });
};

// Get map data for a specific day of itinerary
export const getDayMap = async (
  tripId: string, 
  day: number, 
  itinerary: any
): Promise<ItineraryMapData> => {
  return apiFetch<ItineraryMapData>(`${API_BASE_URL}/api/maps/trip/${tripId}/day/${day}/map`, {
    method: 'POST',
    body: { itinerary }
  });
};
