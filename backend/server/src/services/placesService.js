import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Cache for storing API responses (in-memory for now)
const placesCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Generate realistic places data using Gemini AI
const generateRealisticPlacesData = async (location, type = 'restaurant', radius = 5000) => {
  try {
    console.log('🤖 Generating realistic places data with Gemini AI...');
    
    const prompt = `Generate realistic ${type} options for ${location} within ${radius} meters radius.

Please provide the response as a valid JSON object with this exact structure:
{
  "places": [
    {
      "id": "place_1",
      "name": "Real restaurant/place name",
      "rating": 4.2,
      "userRatingsTotal": 150,
      "priceLevel": 2,
      "types": ["restaurant", "food", "establishment"],
      "vicinity": "Real address near location",
      "geometry": {
        "location": {"lat": 15.2993, "lng": 74.1240}
      },
      "photos": [],
      "note": "AI-generated realistic data"
    }
  ]
}

Make the data realistic with:
- Real restaurant/place names (like McDonald's, Pizza Hut, local restaurants for India)
- Realistic ratings (3.0 to 5.0)
- Realistic price levels (1-4, where 1=cheap, 4=expensive)
- Realistic addresses near the location
- Appropriate types for the category
- Realistic coordinates near the location

Return only the JSON object, no additional text.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response');
    }
    
    const placesData = JSON.parse(jsonMatch[0]);
    console.log('✅ Generated realistic places data with Gemini');
    return placesData.places || [];
  } catch (error) {
    console.error('❌ Error generating places data with Gemini:', error.message);
    throw new Error('Failed to generate places data');
  }
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to create cache key
const createCacheKey = (type, location, radius = 5000) => {
  return `${type}_${location}_${radius}`;
};
// Helper function to clean and structure place data
const cleanPlaceData = (place) => {
  return {
    id: place.place_id,
    name: place.name,
    rating: place.rating || null,
    userRatingsTotal: place.user_ratings_total || 0,
    priceLevel: place.price_level || null,
    types: place.types || [],
    vicinity: place.vicinity || '',
    geometry: {
      location: place.geometry?.location || {},
      viewport: place.geometry?.viewport || {}
    },
    photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
      reference: photo.photo_reference,
      width: photo.width,
      height: photo.height
    })) : []
  };
};

// Fetch nearby places (restaurants, attractions, etc.)
export const getNearbyPlaces = async (location, type = 'restaurant', radius = 5000) => {
  try {
    console.log('🔍 Places API Debug Info:');
    console.log('  Location:', location);
    console.log('  Type:', type);
    console.log('  Radius:', radius);
    console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
    console.log('  GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET');

    // Check cache first
    const cacheKey = createCacheKey(type, location, radius);
    const cachedResult = placesCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('📦 Returning cached places data');
      return cachedResult.data;
    }

    // Try Google Places API first (if API key is available)
    if (process.env.GOOGLE_API_KEY) {
      console.log('🏛️ Using Google Places API for real places data...');
      
      // Make API call if not cached or cache expired
      const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`, {
        params: {
          location,
          radius,
          type,
          key: GOOGLE_API_KEY
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      // Clean and structure the data
      const cleanedPlaces = response.data.results.map(cleanPlaceData);

      // Cache the result
      placesCache.set(cacheKey, {
        data: cleanedPlaces,
        timestamp: Date.now()
      });

      return cleanedPlaces;
    }

    // Fallback to Gemini AI for realistic data
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Using Gemini AI for realistic places data...');
      const placesData = await generateRealisticPlacesData(location, type, radius);
      
      // Cache the result
      placesCache.set(cacheKey, {
        data: placesData,
        timestamp: Date.now()
      });

      return placesData;
    }

    // No API keys available
    console.log('❌ No API keys found - cannot provide places data');
    throw new Error('Places data is not available. Please configure GOOGLE_API_KEY or GEMINI_API_KEY in your environment variables.');
  } catch (error) {
    console.error('Error fetching nearby places:', error.message);
    throw new Error('Failed to fetch places data');
  }
};

// Search for places by text query
export const searchPlaces = async (query, location, radius = 5000) => {
  try {
    // Check cache first
    const cacheKey = createCacheKey(`search_${query}`, location, radius);
    const cachedResult = placesCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached search results');
      return cachedResult.data;
    }

    // Make API call if not cached or cache expired
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/textsearch/json`, {
      params: {
        query,
        location,
        radius,
        key: GOOGLE_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    // Clean and structure the data
    const cleanedPlaces = response.data.results.map(cleanPlaceData);

    // Cache the result
    placesCache.set(cacheKey, {
      data: cleanedPlaces,
      timestamp: Date.now()
    });

    return cleanedPlaces;
  } catch (error) {
    console.error('Error searching places:', error.message);
    throw new Error('Failed to search places');
  }
};

// Get place details by place_id
export const getPlaceDetails = async (placeId) => {
  try {
    // Check cache first
    const cacheKey = `details_${placeId}`;
    const cachedResult = placesCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached place details');
      return cachedResult.data;
    }

    // Make API call if not cached or cache expired
    const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,price_level,types,vicinity,geometry,photos,formatted_address,formatted_phone_number,website,opening_hours,reviews',
        key: GOOGLE_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    const place = response.data.result;
    const cleanedPlace = {
      id: place.place_id,
      name: place.name,
      rating: place.rating || null,
      userRatingsTotal: place.user_ratings_total || 0,
      priceLevel: place.price_level || null,
      types: place.types || [],
      vicinity: place.vicinity || '',
      formattedAddress: place.formatted_address || '',
      phoneNumber: place.formatted_phone_number || '',
      website: place.website || '',
      openingHours: place.opening_hours || null,
      reviews: place.reviews ? place.reviews.slice(0, 5) : [],
      geometry: {
        location: place.geometry?.location || {},
        viewport: place.geometry?.viewport || {}
      },
      photos: place.photos ? place.photos.slice(0, 5).map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : []
    };

    // Cache the result
    placesCache.set(cacheKey, {
      data: cleanedPlace,
      timestamp: Date.now()
    });

    return cleanedPlace;
  } catch (error) {
    console.error('Error fetching place details:', error.message);
    throw new Error('Failed to fetch place details');
  }
};
