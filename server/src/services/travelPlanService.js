import { generateItinerary } from './aiService.js';
import { getAllOptionsForTrip } from '../controllers/optionsController.js';
import Trip from '../models/Trip.js';

// Service to combine AI-generated itinerary with external API data
export const generateCompleteTravelPlan = async (tripId, userId, preferences = {}) => {
  try {
    console.log('🔄 Generating complete travel plan...');
    
    // Step 1: Generate AI itinerary structure
    const trip = await Trip.findOne({ _id: tripId, userId });
    if (!trip) {
      throw new Error('Trip not found');
    }

    const aiInputs = {
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      interests: preferences?.interests || ['exploration', 'culture', 'food'],
      budget: preferences?.budget || 'flexible',
      groupSize: preferences?.groupSize || 1,
      timeLimits: preferences?.timeLimits || null,
      weather: preferences?.weather || null,
      accessibility: preferences?.accessibility || null
    };

    console.log('🤖 Generating AI itinerary structure...');
    const aiItinerary = await generateItinerary(aiInputs);

    // Step 2: Fetch external API data for practical details
    console.log('🔗 Fetching external API data...');
    const externalOptions = await getAllOptionsForTrip(tripId, userId, {
      adults: aiInputs.groupSize,
      rooms: 1,
      radius: 5000
    });

    // Step 3: Combine AI itinerary with external data
    const completePlan = {
      ...aiItinerary,
      externalOptions: externalOptions.data.options,
      metadata: {
        generatedAt: new Date(),
        aiProvider: 'gemini',
        externalApis: {
          transport: 'Aviation Stack, OpenSky Network',
          accommodation: 'RapidAPI Hotels, Booking.com',
          places: 'Yelp, Foursquare, Google Places'
        },
        note: 'AI generates structure, external APIs provide booking options'
      }
    };

    console.log('✅ Complete travel plan generated successfully');
    return completePlan;
  } catch (error) {
    console.error('❌ Error generating complete travel plan:', error);
    throw error;
  }
};

// Service to get transport options for a specific day/activity
export const getTransportOptionsForActivity = async (origin, destination, date, activityType) => {
  try {
    console.log(`🚗 Getting transport options for ${activityType} activity...`);
    
    // This would integrate with your existing transport services
    // For now, throw error as this service needs to be implemented
    throw new Error('Transport options service is not yet implemented. Please use the main transport service instead.');
  } catch (error) {
    console.error('❌ Error getting transport options:', error);
    throw error;
  }
};

// Service to get accommodation options near activity locations
export const getAccommodationOptionsNearActivity = async (location, checkIn, checkOut) => {
  try {
    console.log(`🏨 Getting accommodation options near ${location}...`);
    
    // This would integrate with your existing hotel services
    // For now, throw error as this service needs to be implemented
    throw new Error('Accommodation options service is not yet implemented. Please use the main accommodation service instead.');
  } catch (error) {
    console.error('❌ Error getting accommodation options:', error);
    throw error;
  }
};

// Service to get restaurant options for meal times
export const getRestaurantOptionsForMeal = async (location, mealType, cuisine = null) => {
  try {
    console.log(`🍽️ Getting ${mealType} options in ${location}...`);
    
    // This would integrate with your existing restaurant services
    // For now, throw error as this service needs to be implemented
    throw new Error('Restaurant options service is not yet implemented. Please use the main places service instead.');
  } catch (error) {
    console.error('❌ Error getting restaurant options:', error);
    throw error;
  }
};
