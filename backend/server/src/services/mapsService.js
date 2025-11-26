import axios from 'axios';

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_MAPS_API_KEY; // Fallback to maps key
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// Cache for geocoding results (in-memory)
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to create cache key
const createCacheKey = (query, type) => {
  return `${type}_${query.toLowerCase().replace(/\s+/g, '_')}`;
};

/**
 * Geocode an address to get coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} - Geocoding result with coordinates
 */
export const geocodeAddress = async (address) => {
  try {
    const apiKey = GOOGLE_MAPS_API_KEY || GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured. Using mock data.');
      return {
        success: true,
        data: {
          address: address,
          coordinates: {
            lat: 32.2206 + (Math.random() - 0.5) * 0.1, // Mock coordinates around Dharamshala
            lng: 76.3201 + (Math.random() - 0.5) * 0.1
          },
          formatted_address: address,
          place_id: `mock_place_${Date.now()}`,
          types: ['establishment', 'point_of_interest']
        }
      };
    }

    // Check cache first
    const cacheKey = createCacheKey(address, 'geocode');
    const cachedResult = geocodeCache.get(cacheKey);
    if (isCacheValid(cachedResult)) {
      console.log('📍 Using cached geocoding result');
      return cachedResult.data;
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
      params: {
        address: address,
        key: apiKey
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const geocodeData = {
        success: true,
        data: {
          address: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          types: result.types
        }
      };

      // Cache the result
      geocodeCache.set(cacheKey, {
        data: geocodeData,
        timestamp: Date.now()
      });

      return geocodeData;
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Get directions between two points
 * @param {Object} origin - Origin coordinates {lat, lng}
 * @param {Object} destination - Destination coordinates {lat, lng}
 * @param {string} mode - Travel mode (driving, walking, transit, bicycling)
 * @returns {Promise<Object>} - Directions result
 */
export const getDirections = async (origin, destination, mode = 'driving') => {
  try {
    const apiKey = GOOGLE_MAPS_API_KEY || GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured. Using mock directions.');
      return {
        success: true,
        data: {
          distance: {
            text: '5.2 km',
            value: 5200
          },
          duration: {
            text: '15 mins',
            value: 900
          },
          steps: [
            {
              instruction: 'Head northeast on Main St',
              distance: { text: '1.2 km', value: 1200 },
              duration: { text: '3 mins', value: 180 }
            },
            {
              instruction: 'Turn right at Park Ave',
              distance: { text: '4.0 km', value: 4000 },
              duration: { text: '12 mins', value: 720 }
            }
          ],
          polyline: 'mock_polyline_data'
        }
      };
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/directions/json`, {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: mode,
        key: apiKey
      }
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      return {
        success: true,
        data: {
          distance: leg.distance,
          duration: leg.duration,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
            distance: step.distance,
            duration: step.duration
          })),
          polyline: route.overview_polyline.points
        }
      };
    } else {
      throw new Error(`Directions failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Directions error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Get nearby places using Google Places API
 * @param {Object} location - Location coordinates {lat, lng}
 * @param {string} type - Place type (restaurant, tourist_attraction, etc.)
 * @param {number} radius - Search radius in meters
 * @returns {Promise<Object>} - Places result
 */
export const getNearbyPlaces = async (location, type = 'tourist_attraction', radius = 5000) => {
  try {
    const apiKey = GOOGLE_MAPS_API_KEY || GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured. Using mock places.');
      return {
        success: true,
        data: {
          places: [
            {
              name: 'Local Attraction',
              place_id: `mock_place_${Date.now()}`,
              rating: 4.5,
              vicinity: 'Nearby area',
              types: [type],
              geometry: {
                location: {
                  lat: location.lat + (Math.random() - 0.5) * 0.01,
                  lng: location.lng + (Math.random() - 0.5) * 0.01
                }
              }
            }
          ]
        }
      };
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${location.lat},${location.lng}`,
        radius: radius,
        type: type,
        key: apiKey
      }
    });

    if (response.data.status === 'OK') {
      return {
        success: true,
        data: {
          places: response.data.results.map(place => ({
            name: place.name,
            place_id: place.place_id,
            rating: place.rating || 0,
            vicinity: place.vicinity,
            types: place.types,
            geometry: place.geometry,
            photos: place.photos || []
          }))
        }
      };
    } else {
      throw new Error(`Places search failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Places search error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Get place details by place ID
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details
 */
export const getPlaceDetails = async (placeId) => {
  try {
    const apiKey = GOOGLE_MAPS_API_KEY || GOOGLE_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured. Using mock place details.');
      return {
        success: true,
        data: {
          name: 'Mock Place',
          place_id: placeId,
          formatted_address: 'Mock Address',
          rating: 4.5,
          reviews: [],
          photos: [],
          opening_hours: null,
          website: null,
          phone_number: null
        }
      };
    }

    const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,rating,reviews,photos,opening_hours,website,phone_number',
        key: apiKey
      }
    });

    if (response.data.status === 'OK') {
      return {
        success: true,
        data: response.data.result
      };
    } else {
      throw new Error(`Place details failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Place details error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Calculate total distance and duration for a trip itinerary
 * @param {Array} locations - Array of location objects with coordinates
 * @param {string} mode - Travel mode
 * @returns {Promise<Object>} - Trip summary with distances and durations
 */
export const calculateTripDistance = async (locations, mode = 'driving') => {
  try {
    if (!locations || locations.length < 2) {
      return {
        success: false,
        error: 'At least 2 locations required',
        data: null
      };
    }

    let totalDistance = 0;
    let totalDuration = 0;
    const segments = [];

    for (let i = 0; i < locations.length - 1; i++) {
      const origin = locations[i];
      const destination = locations[i + 1];
      
      const directions = await getDirections(origin, destination, mode);
      
      if (directions.success) {
        totalDistance += directions.data.distance.value;
        totalDuration += directions.data.duration.value;
        segments.push({
          from: origin,
          to: destination,
          distance: directions.data.distance,
          duration: directions.data.duration
        });
      }
    }

    return {
      success: true,
      data: {
        totalDistance: {
          text: `${(totalDistance / 1000).toFixed(1)} km`,
          value: totalDistance
        },
        totalDuration: {
          text: `${Math.round(totalDuration / 60)} mins`,
          value: totalDuration
        },
        segments: segments
      }
    };
  } catch (error) {
    console.error('Trip distance calculation error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Generate map data for an itinerary
 * @param {Object} itinerary - AI-generated itinerary
 * @returns {Promise<Object>} - Map data with coordinates and routes
 */
export const generateItineraryMapData = async (itinerary) => {
  try {
    // Debug: Log the itinerary structure
    console.log('🗺️ Generating map data for itinerary:', {
      hasSummary: !!itinerary?.summary,
      hasDailyPlans: !!itinerary?.dailyPlans,
      dailyPlansLength: itinerary?.dailyPlans?.length || 0,
      summaryDestination: itinerary?.summary?.destination
    });

    // Validate itinerary structure
    if (!itinerary) {
      throw new Error('Itinerary data is required');
    }

    if (!itinerary.summary) {
      console.warn('Itinerary missing summary, using default destination');
      itinerary.summary = { destination: 'Unknown Destination' };
    }

    if (!itinerary.dailyPlans || !Array.isArray(itinerary.dailyPlans)) {
      console.warn('Itinerary missing dailyPlans, using empty array');
      itinerary.dailyPlans = [];
    }

    const mapData = {
      destination: itinerary.summary?.destination || 'Unknown Destination',
      locations: [],
      routes: [],
      bounds: null
    };

    // Extract locations from daily plans
    for (const day of itinerary.dailyPlans) {
      // Validate day structure
      if (!day || typeof day !== 'object') {
        console.warn('Invalid day data, skipping:', day);
        continue;
      }

      const dayLocations = [];
      
      // Process morning, afternoon, evening activities
      const timeSlots = ['morning', 'afternoon', 'evening'];
      for (const timeSlot of timeSlots) {
        if (day[timeSlot] && day[timeSlot].location) {
          try {
            const geocodeResult = await geocodeAddress(day[timeSlot].location);
            if (geocodeResult.success) {
              dayLocations.push({
                ...geocodeResult.data,
                activity: day[timeSlot].activity || 'Activity',
                timeSlot: timeSlot,
                day: day.day || 1
              });
            }
          } catch (geocodeError) {
            console.warn(`Geocoding failed for ${day[timeSlot].location}:`, geocodeError.message);
          }
        }
      }
      
      mapData.locations.push({
        day: day.day || 1,
        date: day.date || new Date().toISOString().split('T')[0],
        locations: dayLocations
      });
    }

    // Calculate routes between locations
    for (let i = 0; i < mapData.locations.length; i++) {
      const day = mapData.locations[i];
      if (day.locations.length > 1) {
        for (let j = 0; j < day.locations.length - 1; j++) {
          const route = await getDirections(
            day.locations[j].coordinates,
            day.locations[j + 1].coordinates
          );
          if (route.success) {
            mapData.routes.push({
              day: day.day,
              from: day.locations[j],
              to: day.locations[j + 1],
              route: route.data
            });
          }
        }
      }
    }

    // Calculate bounds for map view
    if (mapData.locations.length > 0) {
      const allCoords = mapData.locations
        .flatMap(day => day.locations)
        .map(loc => loc.coordinates);
      
      if (allCoords.length > 0) {
        const lats = allCoords.map(coord => coord.lat);
        const lngs = allCoords.map(coord => coord.lng);
        
        mapData.bounds = {
          north: Math.max(...lats),
          south: Math.min(...lats),
          east: Math.max(...lngs),
          west: Math.min(...lngs)
        };
      }
    }

    // If no locations were found, provide a default location
    if (mapData.locations.length === 0) {
      console.warn('No locations found in itinerary, using default location');
      mapData.locations = [{
        day: 1,
        date: new Date().toISOString().split('T')[0],
        locations: [{
          address: mapData.destination,
          coordinates: { lat: 32.2206, lng: 76.3201 }, // Default to Dharamshala
          formatted_address: mapData.destination,
          place_id: 'default_location',
          types: ['establishment'],
          activity: 'Explore the area',
          timeSlot: 'morning',
          day: 1
        }]
      }];
      mapData.bounds = {
        north: 32.2206 + 0.01,
        south: 32.2206 - 0.01,
        east: 76.3201 + 0.01,
        west: 76.3201 - 0.01
      };
    }

    return {
      success: true,
      data: mapData
    };
  } catch (error) {
    console.error('Itinerary map data generation error:', error.message);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};
