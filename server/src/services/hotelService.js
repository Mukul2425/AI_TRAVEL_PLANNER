import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v1';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Cache for storing API responses
const hotelCache = new Map();
const CACHE_DURATION = 20 * 60 * 1000; // 20 minutes for hotel data
let amadeusToken = null;
let tokenExpiry = 0;

// Generate realistic hotel data using Gemini AI
const generateRealisticHotelData = async (location, checkIn, checkOut, adults = 1, rooms = 1) => {
  try {
    console.log('🤖 Generating realistic hotel data with Gemini AI...');
    
    const prompt = `Generate realistic hotel options for ${location} from ${checkIn} to ${checkOut} for ${adults} adult(s) and ${rooms} room(s).

Please provide the response as a valid JSON object with this exact structure:
{
  "hotels": [
    {
      "id": "hotel_1",
      "name": "Real hotel name",
      "location": {
        "city": "City name",
        "country": "Country name",
        "address": "Hotel address"
      },
      "rating": 4.2,
      "price": {"total": "80.00", "currency": "USD"},
      "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
      "image": "https://via.placeholder.com/300x200",
      "note": "AI-generated realistic data"
    }
  ],
  "alternatives": [
    {
      "id": "hostel_1",
      "name": "Real hostel name",
      "type": "hostel",
      "location": {
        "city": "City name",
        "country": "Country name"
      },
      "rating": 3.5,
      "price": {"total": "25.00", "currency": "USD"},
      "amenities": ["WiFi", "Kitchen", "Common Room"],
      "note": "AI-generated realistic data"
    }
  ]
}

Make the data realistic with:
- Real hotel names (like Taj, Oberoi, ITC for India)
- Real hostel names (like Zostel, Backpacker Panda)
- Realistic prices for the location and hotel type
- Realistic ratings (3.0 to 5.0)
- Appropriate amenities for each type
- Realistic addresses

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
    
    const hotelData = JSON.parse(jsonMatch[0]);
    console.log('✅ Generated realistic hotel data with Gemini');
    return hotelData;
  } catch (error) {
    console.error('❌ Error generating hotel data with Gemini:', error.message);
    throw new Error('Failed to generate hotel data');
  }
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to create cache key
const createCacheKey = (location, checkIn, checkOut, adults = 1) => {
  return `hotel_${location}_${checkIn}_${checkOut}_${adults}`;
};
// Get Amadeus access token
const getAmadeusToken = async () => {
  try {
    // Check if we have a valid token
    if (amadeusToken && Date.now() < tokenExpiry) {
      return amadeusToken;
    }

    // Get new token
    const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', 
      `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    amadeusToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000);

    return amadeusToken;
  } catch (error) {
    console.error('Error getting Amadeus token:', error.message);
    throw new Error('Failed to authenticate with Amadeus API');
  }
};

// Search for hotels
export const searchHotels = async (location, checkIn, checkOut, adults = 1, rooms = 1, maxResults = 20) => {
  try {
    // Check cache first
    const cacheKey = createCacheKey(location, checkIn, checkOut, adults);
    const cachedResult = hotelCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached hotel data');
      return cachedResult.data;
    }

    // Get authentication token
    const token = await getAmadeusToken();

    // First, search for hotel offers
    const response = await axios.get(`${AMADEUS_BASE_URL}/reference-data/locations/hotels/by-city`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        cityCode: location,
        radius: 5,
        radiusUnit: 'KM'
      }
    });

    if (!response.data.data || response.data.data.length === 0) {
      return [];
    }

    // Get hotel offers for the first few hotels
    const hotelIds = response.data.data.slice(0, Math.min(maxResults, response.data.data.length))
      .map(hotel => hotel.hotelId);

    // Get detailed offers for these hotels
    const offersResponse = await axios.get(`${AMADEUS_BASE_URL}/shopping/hotel-offers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        hotelIds: hotelIds.join(','),
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: adults,
        roomQuantity: rooms,
        currency: 'USD',
        bestRateOnly: true
      }
    });

    // Clean and structure the data
    const cleanedHotels = offersResponse.data.data.map(hotel => ({
      id: hotel.hotel.hotelId,
      name: hotel.hotel.name,
      rating: hotel.hotel.rating || null,
      category: hotel.hotel.hotelCityCode,
      location: {
        city: hotel.hotel.address.cityName,
        country: hotel.hotel.address.countryCode,
        latitude: hotel.hotel.latitude,
        longitude: hotel.hotel.longitude
      },
      offers: hotel.offers.map(offer => ({
        id: offer.id,
        roomType: offer.room.type,
        boardType: offer.boardType || 'Room Only',
        price: {
          total: offer.price.total,
          currency: offer.price.currency,
          base: offer.price.base,
          taxes: offer.price.taxes
        },
        cancellation: offer.policies?.cancellation || null,
        amenities: offer.amenities || []
      }))
    }));

    // Cache the result
    hotelCache.set(cacheKey, {
      data: cleanedHotels,
      timestamp: Date.now()
    });

    return cleanedHotels;
  } catch (error) {
    console.error('Error searching hotels:', error.message);
    throw new Error('Failed to fetch hotel data');
  }
};

// Search for alternative accommodations (hostels, vacation rentals, etc.)
export const searchAlternativeAccommodations = async (location, checkIn, checkOut, adults = 1) => {
  try {
    // Check cache first
    const cacheKey = `alt_${createCacheKey(location, checkIn, checkOut, adults)}`;
    const cachedResult = hotelCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached alternative accommodation data');
      return cachedResult.data;
    }

    // Alternative accommodation APIs require paid subscriptions
    // For now, return empty array as this data is not available in free APIs
    console.log('ℹ️ Alternative accommodation data not available in free APIs');
    return [];
  } catch (error) {
    console.error('Error searching alternative accommodations:', error.message);
    return [];
  }
};

// Get all accommodation options for a location
export const getAllAccommodationOptions = async (location, checkIn, checkOut, adults = 1, rooms = 1) => {
  try {
    console.log('🔍 Accommodation API Debug Info:');
    console.log('  Location:', location);
    console.log('  Check-in:', checkIn);
    console.log('  Check-out:', checkOut);
    console.log('  Adults:', adults);
    console.log('  Rooms:', rooms);
    console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
    console.log('  AMADEUS_CLIENT_ID:', process.env.AMADEUS_CLIENT_ID ? 'SET' : 'NOT SET');

    // Check cache first
    const cacheKey = createCacheKey(location, checkIn, checkOut, adults);
    const cachedResult = hotelCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('📦 Returning cached accommodation data');
      return cachedResult.data;
    }

    // Try Amadeus first (if API keys are available)
    if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
      console.log('🏨 Using Amadeus API for real hotel data...');
      const [hotels, alternatives] = await Promise.allSettled([
        searchHotels(location, checkIn, checkOut, adults, rooms),
        searchAlternativeAccommodations(location, checkIn, checkOut, adults)
      ]);

      const result = {
        hotels: hotels.status === 'fulfilled' ? hotels.value : [],
        alternatives: alternatives.status === 'fulfilled' ? alternatives.value : [],
        summary: {
          totalOptions: (hotels.status === 'fulfilled' ? hotels.value.length : 0) +
                       (alternatives.status === 'fulfilled' ? alternatives.value.length : 0),
          location: location,
          checkIn: checkIn,
          checkOut: checkOut
        }
      };

      // Cache the result
      hotelCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    }

    // Fallback to Gemini AI for realistic data
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Using Gemini AI for realistic accommodation data...');
      const accommodationData = await generateRealisticHotelData(location, checkIn, checkOut, adults, rooms);
      
      const result = {
        ...accommodationData,
        summary: {
          totalOptions: (accommodationData.hotels?.length || 0) + 
                       (accommodationData.alternatives?.length || 0),
          location: location,
          checkIn: checkIn,
          checkOut: checkOut
        }
      };

      // Cache the result
      hotelCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    }

    // No API keys available
    console.log('❌ No API keys found - cannot provide accommodation data');
    throw new Error('Accommodation data is not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET or GEMINI_API_KEY in your environment variables.');
  } catch (error) {
    console.error('Error getting all accommodation options:', error.message);
    throw new Error('Failed to fetch accommodation options');
  }
};

// Get hotel details by ID
export const getHotelDetails = async (hotelId) => {
  try {
    // Check cache first
    const cacheKey = `details_${hotelId}`;
    const cachedResult = hotelCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached hotel details');
      return cachedResult.data;
    }

    // Get authentication token
    const token = await getAmadeusToken();

    // Get hotel details
    const response = await axios.get(`${AMADEUS_BASE_URL}/reference-data/locations/hotels/${hotelId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Clean and structure the data
    const hotel = response.data.data;
    const cleanedHotel = {
      id: hotel.hotelId,
      name: hotel.name,
      rating: hotel.rating || null,
      category: hotel.category || null,
      location: {
        city: hotel.address?.cityName || '',
        country: hotel.address?.countryCode || '',
        latitude: hotel.latitude || null,
        longitude: hotel.longitude || null,
        address: hotel.address?.lines || []
      },
      amenities: hotel.amenities || [],
      description: hotel.description?.text || '',
      contact: {
        phone: hotel.contact?.phone || '',
        fax: hotel.contact?.fax || '',
        email: hotel.contact?.email || ''
      }
    };

    // Cache the result
    hotelCache.set(cacheKey, {
      data: cleanedHotel,
      timestamp: Date.now()
    });

    return cleanedHotel;
  } catch (error) {
    console.error('Error getting hotel details:', error.message);
    throw new Error('Failed to fetch hotel details');
  }
};
