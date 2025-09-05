import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com/v1';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Cache for storing API responses and tokens
const transportCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for transport data
let amadeusToken = null;
let tokenExpiry = 0;

// Generate realistic transport data using Gemini AI
const generateRealisticTransportData = async (origin, destination, departureDate, returnDate = null) => {
  try {
    console.log('🤖 Generating realistic transport data with Gemini AI...');
    
    const prompt = `Generate realistic flight, train, and bus options for travel from ${origin} to ${destination} on ${departureDate}${returnDate ? ` with return on ${returnDate}` : ''}.

Please provide the response as a valid JSON object with this exact structure:
{
  "flights": [
    {
      "id": "flight_1",
      "airline": "Real airline name",
      "flightNumber": "Flight number",
      "price": {"total": "150.00", "currency": "USD"},
      "departure": {"airport": "Origin airport code", "time": "2024-01-15T08:00:00Z", "terminal": "1"},
      "arrival": {"airport": "Destination airport code", "time": "2024-01-15T10:30:00Z", "terminal": "2"},
      "duration": "PT2H30M",
      "segments": 1,
      "cabinClass": "Economy",
      "note": "AI-generated realistic data"
    }
  ],
  "trains": [
    {
      "id": "train_1",
      "carrier": "Real train company",
      "trainNumber": "Train number",
      "price": {"total": "45.00", "currency": "USD"},
      "departure": {"station": "Origin station", "time": "2024-01-15T09:00:00Z"},
      "arrival": {"station": "Destination station", "time": "2024-01-15T12:00:00Z"},
      "duration": "PT3H",
      "segments": 1,
      "note": "AI-generated realistic data"
    }
  ],
  "buses": [
    {
      "id": "bus_1",
      "carrier": "Real bus company",
      "price": {"total": "25.00", "currency": "USD"},
      "departure": {"station": "Origin bus station", "time": "2024-01-15T08:30:00Z"},
      "arrival": {"station": "Destination bus station", "time": "2024-01-15T12:30:00Z"},
      "duration": "PT4H",
      "segments": 1,
      "note": "AI-generated realistic data"
    }
  ]
}

Make the data realistic with:
- Real airline names (like Air India, IndiGo, SpiceJet for India)
- Real train companies (like Indian Railways)
- Real bus companies (like RedBus, Volvo)
- Realistic prices for the route
- Realistic travel times
- Real airport/station codes where applicable

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
    
    const transportData = JSON.parse(jsonMatch[0]);
    console.log('✅ Generated realistic transport data with Gemini');
    return transportData;
  } catch (error) {
    console.error('❌ Error generating transport data with Gemini:', error.message);
    throw new Error('Failed to generate transport data');
  }
};

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to create cache key
const createCacheKey = (type, from, to, date) => {
  return `${type}_${from}_${to}_${date}`;
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

// Search for flights
export const searchFlights = async (origin, destination, departureDate, returnDate = null, adults = 1) => {
  try {
    // Check cache first
    const cacheKey = createCacheKey('flight', origin, destination, departureDate);
    const cachedResult = transportCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached flight data');
      return cachedResult.data;
    }

    // Get authentication token
    const token = await getAmadeusToken();

    // Make API call
    const response = await axios.get(`${AMADEUS_BASE_URL}/shopping/flight-offers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        returnDate,
        adults,
        max: 20,
        currencyCode: 'USD'
      }
    });

    // Clean and structure the data
    const cleanedFlights = response.data.data.map(flight => ({
      id: flight.id,
      price: flight.price,
      currency: flight.price.currency,
      total: flight.price.total,
      departure: {
        airport: flight.itineraries[0].segments[0].departure.iataCode,
        time: flight.itineraries[0].segments[0].departure.at,
        terminal: flight.itineraries[0].segments[0].departure.terminal
      },
      arrival: {
        airport: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode,
        time: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.at,
        terminal: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.terminal
      },
      duration: flight.itineraries[0].duration,
      segments: flight.itineraries[0].segments.length,
      airline: flight.validatingAirlineCodes[0],
      cabinClass: flight.travelerPricings[0].fareDetailsBySegment[0].cabin
    }));

    // Cache the result
    transportCache.set(cacheKey, {
      data: cleanedFlights,
      timestamp: Date.now()
    });

    return cleanedFlights;
  } catch (error) {
    console.error('Error searching flights:', error.message);
    throw new Error('Failed to fetch flight data');
  }
};

// Search for trains (using Amadeus train search)
export const searchTrains = async (origin, destination, departureDate) => {
  try {
    // Check cache first
    const cacheKey = createCacheKey('train', origin, destination, departureDate);
    const cachedResult = transportCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached train data');
      return cachedResult.data;
    }

    // Get authentication token
    const token = await getAmadeusToken();

    // Make API call for train search
    const response = await axios.get(`${AMADEUS_BASE_URL}/shopping/train-offers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        origin: origin,
        destination: destination,
        departureDate
      }
    });

    // Clean and structure the data
    const cleanedTrains = response.data.data.map(train => ({
      id: train.id,
      price: train.price,
      currency: train.price.currency,
      total: train.price.total,
      departure: {
        station: train.itineraries[0].segments[0].departure.stationCode,
        time: train.itineraries[0].segments[0].departure.at
      },
      arrival: {
        station: train.itineraries[0].segments[train.itineraries[0].segments.length - 1].arrival.stationCode,
        time: train.itineraries[0].segments[train.itineraries[0].segments.length - 1].arrival.at
      },
      duration: train.itineraries[0].duration,
      segments: train.itineraries[0].segments.length,
      trainNumber: train.itineraries[0].segments[0].carrierCode
    }));

    // Cache the result
    transportCache.set(cacheKey, {
      data: cleanedTrains,
      timestamp: Date.now()
    });

    return cleanedTrains;
  } catch (error) {
    console.error('Error searching trains:', error.message);
    // Return empty array if train search fails (not all locations support trains)
    return [];
  }
};

// Search for buses (most bus APIs require paid subscriptions)
export const searchBuses = async (origin, destination, departureDate) => {
  try {
    // Check cache first
    const cacheKey = createCacheKey('bus', origin, destination, departureDate);
    const cachedResult = transportCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('Returning cached bus data');
      return cachedResult.data;
    }

    // Most bus APIs require paid subscriptions
    // For now, return empty array as bus data is not available in free APIs
    console.log('ℹ️ Bus data not available in free APIs');
    return [];
  } catch (error) {
    console.error('Error searching buses:', error.message);
    return [];
  }
};

// Get all transport options for a route
export const getAllTransportOptions = async (origin, destination, departureDate, returnDate = null) => {
  try {
    console.log('🔍 Transport API Debug Info:');
    console.log('  Origin:', origin);
    console.log('  Destination:', destination);
    console.log('  Departure Date:', departureDate);
    console.log('  Return Date:', returnDate);
    console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
    console.log('  AMADEUS_CLIENT_ID:', process.env.AMADEUS_CLIENT_ID ? 'SET' : 'NOT SET');

    // Check cache first
    const cacheKey = createCacheKey('all', origin, destination, departureDate);
    const cachedResult = transportCache.get(cacheKey);
    
    if (isCacheValid(cachedResult)) {
      console.log('📦 Returning cached transport data');
      return cachedResult.data;
    }

    // Try Amadeus first (if API keys are available)
    if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
      console.log('🚀 Using Amadeus API for real flight data...');
      const [flights, trains, buses] = await Promise.allSettled([
        searchFlights(origin, destination, departureDate, returnDate),
        searchTrains(origin, destination, departureDate),
        searchBuses(origin, destination, departureDate)
      ]);

      const result = {
        flights: flights.status === 'fulfilled' ? flights.value : [],
        trains: trains.status === 'fulfilled' ? trains.value : [],
        buses: buses.status === 'fulfilled' ? buses.value : [],
        summary: {
          totalOptions: (flights.status === 'fulfilled' ? flights.value.length : 0) +
                       (trains.status === 'fulfilled' ? trains.value.length : 0) +
                       (buses.status === 'fulfilled' ? buses.value.length : 0)
        }
      };

      // Cache the result
      transportCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    }

    // Fallback to Gemini AI for realistic data
    if (process.env.GEMINI_API_KEY) {
      console.log('🤖 Using Gemini AI for realistic transport data...');
      const transportData = await generateRealisticTransportData(origin, destination, departureDate, returnDate);
      
      const result = {
        ...transportData,
        summary: {
          totalOptions: (transportData.flights?.length || 0) + 
                       (transportData.trains?.length || 0) + 
                       (transportData.buses?.length || 0)
        }
      };

      // Cache the result
      transportCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    }

    // No API keys available
    console.log('❌ No API keys found - cannot provide transport data');
    throw new Error('Transport data is not available. Please configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET or GEMINI_API_KEY in your environment variables.');
  } catch (error) {
    console.error('Error getting all transport options:', error.message);
    throw new Error('Failed to fetch transport options');
  }
};
