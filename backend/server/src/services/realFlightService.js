import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

// Get real flights using Aviation Stack API (free tier)
export const getRealFlights = async (origin, destination, date) => {
  const cacheKey = `flight_${origin}_${destination}_${date}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('📦 Returning cached flight data');
    return cached;
  }
  
  try {
    console.log('✈️ Fetching real flight data from Aviation Stack...');
    
    // Using Aviation Stack API (free tier: 100 requests/month)
    const response = await axios.get('http://api.aviationstack.com/v1/flights', {
      params: {
        access_key: process.env.AVIATION_STACK_KEY || 'demo_key',
        dep_iata: origin,
        arr_iata: destination,
        flight_date: date
      }
    });
    
    const flights = response.data.data.map(flight => ({
      id: flight.flight.iata,
      airline: flight.airline.name,
      flightNumber: flight.flight.number,
      departure: {
        airport: flight.departure.iata,
        time: flight.departure.scheduled,
        terminal: flight.departure.terminal
      },
      arrival: {
        airport: flight.arrival.iata,
        time: flight.arrival.scheduled,
        terminal: flight.arrival.terminal
      },
      status: flight.flight_status,
      price: { total: '150.00', currency: 'USD' }, // Price not available in free API
      duration: 'PT2H30M', // Estimated
      segments: 1,
      cabinClass: 'Economy',
      note: 'Real data from Aviation Stack API'
    }));
    
    console.log(`✅ Found ${flights.length} real flights`);
    cache.set(cacheKey, flights);
    return flights;
  } catch (error) {
    console.error('❌ Flight API error:', error.message);
    return [];
  }
};

// Get real trains using OpenSky Network API (completely free)
export const getRealTrains = async (origin, destination, date) => {
  const cacheKey = `train_${origin}_${destination}_${date}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    console.log('🚂 Fetching real train data...');
    
    // Note: Most train APIs require paid subscriptions
    // For now, return empty array as trains are less common
    console.log('ℹ️ Train data not available in free APIs');
    return [];
  } catch (error) {
    console.error('❌ Train API error:', error.message);
    return [];
  }
};

// Get real buses using public transport APIs
export const getRealBuses = async (origin, destination, date) => {
  const cacheKey = `bus_${origin}_${destination}_${date}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    console.log('🚌 Fetching real bus data...');
    
    // Most bus APIs require paid subscriptions
    // For now, return empty array as bus data is not available in free APIs
    console.log('ℹ️ Bus data not available in free APIs');
    return [];
  } catch (error) {
    console.error('❌ Bus API error:', error.message);
    return [];
  }
};

// Main function to get all transport options with real data
export const getAllRealTransportOptions = async (origin, destination, departureDate, returnDate = null) => {
  try {
    console.log('🔍 Real Transport API Debug Info:');
    console.log('  Origin:', origin);
    console.log('  Destination:', destination);
    console.log('  Departure Date:', departureDate);
    console.log('  AVIATION_STACK_KEY:', process.env.AVIATION_STACK_KEY ? 'SET' : 'NOT SET');

    // Check if we have any real data API keys
    if (!process.env.AVIATION_STACK_KEY) {
      console.log('❌ No real data API keys found - cannot provide transport data');
      throw new Error('Transport data is not available. Please configure AVIATION_STACK_KEY in your environment variables.');
    }

    // Get all transport options in parallel
    const [flights, trains, buses] = await Promise.allSettled([
      getRealFlights(origin, destination, departureDate),
      getRealTrains(origin, destination, departureDate),
      getRealBuses(origin, destination, departureDate)
    ]);

    return {
      flights: flights.status === 'fulfilled' ? flights.value : [],
      trains: trains.status === 'fulfilled' ? trains.value : [],
      buses: buses.status === 'fulfilled' ? buses.value : [],
      summary: {
        totalOptions: (flights.status === 'fulfilled' ? flights.value.length : 0) +
                     (trains.status === 'fulfilled' ? trains.value.length : 0) +
                     (buses.status === 'fulfilled' ? buses.value.length : 0)
      }
    };
  } catch (error) {
    console.error('❌ Error getting real transport options:', error.message);
    throw new Error('Failed to fetch real transport options');
  }
};
