import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

// Get real restaurants using Yelp Fusion API (free: 500 requests/day)
export const getRealRestaurants = async (location, term = 'restaurant') => {
  const cacheKey = `restaurant_${location}_${term}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('📦 Returning cached restaurant data');
    return cached;
  }
  
  try {
    console.log('🍽️ Fetching real restaurant data from Yelp...');
    
    // Using Yelp Fusion API (free: 500 requests/day)
    const response = await axios.get(`https://api.yelp.com/v3/businesses/search`, {
      params: {
        location: location,
        term: term,
        limit: 20,
        sort_by: 'rating'
      },
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`
      }
    });
    
    const restaurants = response.data.businesses.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      rating: restaurant.rating,
      price: restaurant.price,
      location: {
        address: restaurant.location.address1,
        city: restaurant.location.city,
        state: restaurant.location.state,
        zip_code: restaurant.location.zip_code
      },
      categories: restaurant.categories.map(cat => cat.title),
      phone: restaurant.phone,
      image: restaurant.image_url,
      url: restaurant.url,
      distance: restaurant.distance,
      note: 'Real data from Yelp API'
    }));
    
    console.log(`✅ Found ${restaurants.length} real restaurants`);
    cache.set(cacheKey, restaurants);
    return restaurants;
  } catch (error) {
    console.error('❌ Restaurant API error:', error.message);
    return [];
  }
};

// Get real restaurants using Foursquare Places API (free tier available)
export const getFoursquareRestaurants = async (location, query = 'restaurant') => {
  const cacheKey = `foursquare_${location}_${query}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    console.log('🍽️ Fetching restaurant data from Foursquare...');
    
    // Using Foursquare Places API (free tier available)
    const response = await axios.get('https://api.foursquare.com/v3/places/search', {
      params: {
        query: query,
        near: location,
        limit: 20
      },
      headers: {
        'Authorization': process.env.FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const restaurants = response.data.results.map(place => ({
      id: place.fsq_id,
      name: place.name,
      rating: place.rating || 4.0,
      location: {
        address: place.location.address,
        city: place.location.locality,
        state: place.location.region,
        country: place.location.country
      },
      categories: place.categories.map(cat => cat.name),
      note: 'Real data from Foursquare API'
    }));
    
    cache.set(cacheKey, restaurants);
    return restaurants;
  } catch (error) {
    console.error('❌ Foursquare API error:', error.message);
    return [];
  }
};

// Get real attractions and places using Google Places API
export const getRealAttractions = async (location, type = 'tourist_attraction') => {
  const cacheKey = `attraction_${location}_${type}`;
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  try {
    console.log('🏛️ Fetching attraction data from Google Places...');
    
    // Using Google Places API
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: location,
        radius: 5000,
        type: type,
        key: process.env.GOOGLE_API_KEY
      }
    });
    
    const attractions = response.data.results.map(place => ({
      id: place.place_id,
      name: place.name,
      rating: place.rating,
      location: {
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      types: place.types,
      photos: place.photos,
      note: 'Real data from Google Places API'
    }));
    
    cache.set(cacheKey, attractions);
    return attractions;
  } catch (error) {
    console.error('❌ Google Places API error:', error.message);
    return [];
  }
};

// Main function to get all restaurant and attraction options with real data
export const getAllRealPlaces = async (location, radius = 5000) => {
  try {
    console.log('🔍 Real Places API Debug Info:');
    console.log('  Location:', location);
    console.log('  Radius:', radius);
    console.log('  YELP_API_KEY:', process.env.YELP_API_KEY ? 'SET' : 'NOT SET');
    console.log('  GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET');

    // Check if we have any real data API keys
    if (!process.env.YELP_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.log('❌ No real data API keys found - cannot provide places data');
      throw new Error('Places data is not available. Please configure YELP_API_KEY or GOOGLE_API_KEY in your environment variables.');
    }

    // Get all places in parallel
    const [restaurants, foursquareRestaurants, attractions] = await Promise.allSettled([
      getRealRestaurants(location, 'restaurant'),
      getFoursquareRestaurants(location, 'restaurant'),
      getRealAttractions(location, 'tourist_attraction')
    ]);

    // Combine all results
    const allPlaces = [
      ...(restaurants.status === 'fulfilled' ? restaurants.value : []),
      ...(foursquareRestaurants.status === 'fulfilled' ? foursquareRestaurants.value : []),
      ...(attractions.status === 'fulfilled' ? attractions.value : [])
    ];

    console.log(`✅ Found ${allPlaces.length} total places`);
    return allPlaces;
  } catch (error) {
    console.error('❌ Error getting real places:', error.message);
    throw new Error('Failed to fetch real places');
  }
};

// Search for specific places using text search
export const searchRealPlaces = async (query, location) => {
  try {
    console.log(`🔍 Searching for: "${query}" in ${location}`);
    
    // Try Yelp first
    if (process.env.YELP_API_KEY) {
      const yelpResults = await getRealRestaurants(location, query);
      if (yelpResults.length > 0) {
        return yelpResults;
      }
    }
    
    // Try Google Places as fallback
    if (process.env.GOOGLE_API_KEY) {
      const googleResults = await getRealAttractions(location, 'establishment');
      return googleResults.filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // No APIs available
    throw new Error('Places search is not available. Please configure YELP_API_KEY or GOOGLE_API_KEY in your environment variables.');
  } catch (error) {
    console.error('❌ Search error:', error.message);
    return [];
  }
};
