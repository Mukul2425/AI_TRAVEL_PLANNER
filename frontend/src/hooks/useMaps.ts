import { useState, useEffect, useCallback } from 'react';
import { 
  geocodeAddress, 
  getDirections, 
  getNearbyPlaces, 
  getPlaceDetails,
  calculateTripDistance,
  getTripItineraryMap,
  getDayMap,
  ItineraryMapData,
  Coordinates,
  GeocodeResult,
  DirectionsResult,
  Place,
  TripDistanceResult
} from '../api/mapsClient';

export const useMaps = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocode an address
  const geocode = useCallback(async (address: string): Promise<GeocodeResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await geocodeAddress(address);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get directions between two points
  const getDirectionsBetween = useCallback(async (
    origin: Coordinates, 
    destination: Coordinates, 
    mode: string = 'driving'
  ): Promise<DirectionsResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDirections(origin, destination, mode);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Directions failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get nearby places
  const getNearby = useCallback(async (
    location: Coordinates, 
    type: string = 'tourist_attraction', 
    radius: number = 5000
  ): Promise<Place[] | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getNearbyPlaces(location, type, radius);
      return result.places;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nearby places search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get place details
  const getPlace = useCallback(async (placeId: string): Promise<any | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPlaceDetails(placeId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Place details failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate trip distance
  const calculateDistance = useCallback(async (
    locations: Coordinates[], 
    mode: string = 'driving'
  ): Promise<TripDistanceResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await calculateTripDistance(locations, mode);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Distance calculation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get trip itinerary map data
  const getItineraryMap = useCallback(async (
    tripId: string, 
    itinerary: any
  ): Promise<ItineraryMapData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getTripItineraryMap(tripId, itinerary);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Itinerary map generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get day map data
  const getDayMapData = useCallback(async (
    tripId: string, 
    day: number, 
    itinerary: any
  ): Promise<ItineraryMapData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDayMap(tripId, day, itinerary);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Day map generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    geocode,
    getDirectionsBetween,
    getNearby,
    getPlace,
    calculateDistance,
    getItineraryMap,
    getDayMapData
  };
};

// Hook for managing itinerary map data
export const useItineraryMap = (tripId: string, itinerary: any) => {
  const [mapData, setMapData] = useState<ItineraryMapData | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const { loading, error, getItineraryMap, getDayMapData } = useMaps();

  // Load full itinerary map data
  const loadItineraryMap = useCallback(async () => {
    if (!tripId || !itinerary) {
      console.log('🗺️ Skipping map load - missing tripId or itinerary:', { tripId: !!tripId, itinerary: !!itinerary });
      return;
    }
    
    console.log('🗺️ Loading itinerary map data:', {
      tripId,
      itineraryStructure: {
        hasSummary: !!itinerary?.summary,
        hasDailyPlans: !!itinerary?.dailyPlans,
        dailyPlansLength: itinerary?.dailyPlans?.length || 0,
        summaryDestination: itinerary?.summary?.destination
      }
    });
    
    const result = await getItineraryMap(tripId, itinerary);
    if (result) {
      setMapData(result);
    }
  }, [tripId, itinerary, getItineraryMap]);

  // Load specific day map data
  const loadDayMap = useCallback(async (day: number) => {
    if (!tripId || !itinerary) return;
    
    const result = await getDayMapData(tripId, day, itinerary);
    if (result) {
      setMapData(result);
      setSelectedDay(day);
    }
  }, [tripId, itinerary, getDayMapData]);

  // Load map data when trip or itinerary changes
  useEffect(() => {
    loadItineraryMap();
  }, [loadItineraryMap]);

  return {
    mapData,
    selectedDay,
    loading,
    error,
    loadItineraryMap,
    loadDayMap,
    setSelectedDay
  };
};

// Hook for managing location search and selection
export const useLocationSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  const { loading, error, geocode } = useMaps();

  // Search for locations
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchQuery(query);
    const result = await geocode(query);
    
    if (result) {
      setSearchResults([result]);
    } else {
      setSearchResults([]);
    }
  }, [geocode]);

  // Select a location
  const selectLocation = useCallback((location: GeocodeResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.address);
    setSearchResults([]);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedLocation,
    loading,
    error,
    searchLocations,
    selectLocation,
    clearSelection
  };
};
