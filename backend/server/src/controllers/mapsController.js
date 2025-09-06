import { 
  geocodeAddress, 
  getDirections, 
  getNearbyPlaces, 
  getPlaceDetails, 
  calculateTripDistance,
  generateItineraryMapData 
} from '../services/mapsService.js';
import Trip from '../models/Trip.js';

// @desc    Geocode an address to get coordinates
// @route   POST /api/maps/geocode
// @access  Private (requires JWT)
const geocodeLocation = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ 
        message: 'Address is required' 
      });
    }

    const result = await geocodeAddress(address);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Geocoding failed' 
      });
    }
  } catch (error) {
    console.error('Geocode location error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get directions between two points
// @route   POST /api/maps/directions
// @access  Private (requires JWT)
const getDirectionsBetweenPoints = async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        message: 'Origin and destination are required' 
      });
    }

    // Validate coordinates format
    const validateCoordinates = (coord) => {
      return coord && 
             typeof coord.lat === 'number' && 
             typeof coord.lng === 'number' &&
             coord.lat >= -90 && coord.lat <= 90 &&
             coord.lng >= -180 && coord.lng <= 180;
    };

    if (!validateCoordinates(origin) || !validateCoordinates(destination)) {
      return res.status(400).json({ 
        message: 'Invalid coordinates format. Expected {lat: number, lng: number}' 
      });
    }

    const result = await getDirections(origin, destination, mode);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Directions failed' 
      });
    }
  } catch (error) {
    console.error('Get directions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get nearby places
// @route   POST /api/maps/nearby
// @access  Private (requires JWT)
const getNearbyLocations = async (req, res) => {
  try {
    const { location, type = 'tourist_attraction', radius = 5000 } = req.body;

    if (!location) {
      return res.status(400).json({ 
        message: 'Location coordinates are required' 
      });
    }

    // Validate coordinates format
    if (!location.lat || !location.lng || 
        typeof location.lat !== 'number' || 
        typeof location.lng !== 'number') {
      return res.status(400).json({ 
        message: 'Invalid location format. Expected {lat: number, lng: number}' 
      });
    }

    const result = await getNearbyPlaces(location, type, radius);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Nearby places search failed' 
      });
    }
  } catch (error) {
    console.error('Get nearby places error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get place details by place ID
// @route   GET /api/maps/place/:placeId
// @access  Private (requires JWT)
const getPlaceInfo = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({ 
        message: 'Place ID is required' 
      });
    }

    const result = await getPlaceDetails(placeId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Place details failed' 
      });
    }
  } catch (error) {
    console.error('Get place details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Calculate trip distance and duration
// @route   POST /api/maps/trip-distance
// @access  Private (requires JWT)
const calculateTripMetrics = async (req, res) => {
  try {
    const { locations, mode = 'driving' } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 locations are required' 
      });
    }

    // Validate coordinates format
    const validateCoordinates = (coord) => {
      return coord && 
             typeof coord.lat === 'number' && 
             typeof coord.lng === 'number' &&
             coord.lat >= -90 && coord.lat <= 90 &&
             coord.lng >= -180 && coord.lng <= 180;
    };

    for (const location of locations) {
      if (!validateCoordinates(location)) {
        return res.status(400).json({ 
          message: 'Invalid coordinates format. Expected {lat: number, lng: number}' 
        });
      }
    }

    const result = await calculateTripDistance(locations, mode);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Trip distance calculation failed' 
      });
    }
  } catch (error) {
    console.error('Calculate trip distance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate map data for a trip itinerary
// @route   POST /api/maps/trip/:tripId/itinerary-map
// @access  Private (requires JWT)
const getTripItineraryMap = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { itinerary } = req.body;

    // Find trip and check ownership
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // If itinerary is provided in request body, use it
    // Otherwise, you might want to fetch it from the database
    if (!itinerary) {
      return res.status(400).json({ 
        message: 'Itinerary data is required' 
      });
    }

    const result = await generateItineraryMapData(itinerary);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Itinerary map generation failed' 
      });
    }
  } catch (error) {
    console.error('Get trip itinerary map error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get map data for a specific day of itinerary
// @route   POST /api/maps/trip/:tripId/day/:day/map
// @access  Private (requires JWT)
const getDayMap = async (req, res) => {
  try {
    const { tripId, day } = req.params;
    const { itinerary } = req.body;

    // Find trip and check ownership
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (!itinerary || !itinerary.dailyPlans) {
      return res.status(400).json({ 
        message: 'Itinerary data is required' 
      });
    }

    const dayPlan = itinerary.dailyPlans.find(d => d.day === parseInt(day));
    if (!dayPlan) {
      return res.status(404).json({ 
        message: `Day ${day} not found in itinerary` 
      });
    }

    // Generate map data for this specific day
    const dayItinerary = {
      summary: itinerary.summary,
      dailyPlans: [dayPlan]
    };

    const result = await generateItineraryMapData(dayItinerary);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ 
        message: result.error || 'Day map generation failed' 
      });
    }
  } catch (error) {
    console.error('Get day map error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export {
  geocodeLocation,
  getDirectionsBetweenPoints,
  getNearbyLocations,
  getPlaceInfo,
  calculateTripMetrics,
  getTripItineraryMap,
  getDayMap
};
