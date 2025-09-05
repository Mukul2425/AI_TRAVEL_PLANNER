import { getAllTransportOptions } from '../services/transportService.js';
import { getAllAccommodationOptions } from '../services/hotelService.js';
import { getNearbyPlaces, searchPlaces } from '../services/placesService.js';
import CartItem from '../models/Cart.js';
import Trip from '../models/Trip.js';

// @desc    Get all transport options for a trip
// @route   GET /api/options/:tripId/transport
// @access  Private (requires JWT)
const getTransportOptions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { returnDate } = req.query;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Get transport options
    const transportOptions = await getAllTransportOptions(
      trip.originStation,
      trip.destination,
      trip.startDate.toISOString().split('T')[0],
      returnDate || null
    );

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          origin: trip.originStation,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate
        },
        transportOptions
      }
    });
  } catch (error) {
    console.error('Get transport options error:', error);
    res.status(500).json({
      message: 'Failed to fetch transport options',
      error: error.message
    });
  }
};

// @desc    Get all accommodation options for a trip
// @route   GET /api/options/:tripId/accommodation
// @access  Private (requires JWT)
const getAccommodationOptions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { adults = 1, rooms = 1 } = req.query;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Get accommodation options
    const accommodationOptions = await getAllAccommodationOptions(
      trip.destination,
      trip.startDate.toISOString().split('T')[0],
      trip.endDate.toISOString().split('T')[0],
      parseInt(adults),
      parseInt(rooms)
    );

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate
        },
        accommodationOptions
      }
    });
  } catch (error) {
    console.error('Get accommodation options error:', error);
    res.status(500).json({
      message: 'Failed to fetch accommodation options',
      error: error.message
    });
  }
};

// @desc    Get restaurant options for a trip
// @route   GET /api/options/:tripId/restaurants
// @access  Private (requires JWT)
const getRestaurantOptions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { radius = 5000, query } = req.query;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    let restaurants;

    if (query) {
      // Search for specific restaurants
      restaurants = await searchPlaces(
        `${query} restaurants in ${trip.destination}`,
        `${trip.destination}`,
        parseInt(radius)
      );
    } else {
      // Get nearby restaurants
      restaurants = await getNearbyPlaces(
        trip.destination,
        'restaurant',
        parseInt(radius)
      );
    }

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          destination: trip.destination
        },
        restaurants: {
          count: restaurants.length,
          results: restaurants
        }
      }
    });
  } catch (error) {
    console.error('Get restaurant options error:', error);
    res.status(500).json({
      message: 'Failed to fetch restaurant options',
      error: error.message
    });
  }
};

// @desc    Add transport option to cart
// @route   POST /api/options/:tripId/transport/add-to-cart
// @access  Private (requires JWT)
const addTransportToCart = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { 
      transportType, 
      transportId, 
      transportName, 
      price, 
      departureTime, 
      arrivalTime,
      duration,
      details = {}
    } = req.body;

    // Validate required fields
    if (!transportType || !transportId || !transportName || !price || !departureTime) {
      return res.status(400).json({
        message: 'Missing required fields: transportType, transportId, transportName, price, and departureTime are required'
      });
    }

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Create cart item
    const cartItem = new CartItem({
      userId: req.user._id,
      tripId,
      itemType: 'transport',
      itemName: `${transportType.toUpperCase()}: ${transportName}`,
      itemId: transportId,
      price: {
        amount: parseFloat(price.total || price),
        currency: price.currency || 'USD'
      },
      quantity: 1,
      duration: duration || '1 journey',
      date: new Date(departureTime),
      details: {
        transportType,
        departureTime,
        arrivalTime,
        duration,
        ...details
      }
    });

    await cartItem.save();

    res.status(201).json({
      success: true,
      message: 'Transport added to cart successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Add transport to cart error:', error);
    res.status(500).json({
      message: 'Failed to add transport to cart',
      error: error.message
    });
  }
};

// @desc    Add accommodation option to cart
// @route   POST /api/options/:tripId/accommodation/add-to-cart
// @access  Private (requires JWT)
const addAccommodationToCart = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { 
      accommodationType, 
      accommodationId, 
      accommodationName, 
      offerId,
      price, 
      checkIn, 
      checkOut,
      roomType,
      boardType,
      details = {}
    } = req.body;

    // Validate required fields
    if (!accommodationType || !accommodationId || !accommodationName || !price || !checkIn || !checkOut) {
      return res.status(400).json({
        message: 'Missing required fields: accommodationType, accommodationId, accommodationName, price, checkIn, and checkOut are required'
      });
    }

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Calculate duration
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const durationDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Create cart item
    const cartItem = new CartItem({
      userId: req.user._id,
      tripId,
      itemType: 'hotel',
      itemName: `${accommodationType}: ${accommodationName}`,
      itemId: accommodationId,
      price: {
        amount: parseFloat(price.total || price),
        currency: price.currency || 'USD'
      },
      quantity: 1,
      duration: `${durationDays} day${durationDays > 1 ? 's' : ''}`,
      date: checkInDate,
      details: {
        accommodationType,
        offerId,
        checkIn,
        checkOut,
        roomType,
        boardType,
        durationDays,
        ...details
      }
    });

    await cartItem.save();

    res.status(201).json({
      success: true,
      message: 'Accommodation added to cart successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Add accommodation to cart error:', error);
    res.status(500).json({
      message: 'Failed to add accommodation to cart',
      error: error.message
    });
  }
};

// @desc    Add restaurant option to cart
// @route   POST /api/options/:tripId/restaurants/add-to-cart
// @access  Private (requires JWT)
const addRestaurantToCart = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { 
      restaurantId, 
      restaurantName, 
      price, 
      date,
      mealType = 'dinner',
      partySize = 2,
      details = {}
    } = req.body;

    // Validate required fields
    if (!restaurantId || !restaurantName || !price || !date) {
      return res.status(400).json({
        message: 'Missing required fields: restaurantId, restaurantName, price, and date are required'
      });
    }

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Create cart item
    const cartItem = new CartItem({
      userId: req.user._id,
      tripId,
      itemType: 'restaurant',
      itemName: `Restaurant: ${restaurantName}`,
      itemId: restaurantId,
      price: {
        amount: parseFloat(price),
        currency: 'USD'
      },
      quantity: partySize,
      duration: '1 meal',
      date: new Date(date),
      details: {
        mealType,
        partySize,
        ...details
      }
    });

    await cartItem.save();

    res.status(201).json({
      success: true,
      message: 'Restaurant added to cart successfully',
      data: cartItem
    });
  } catch (error) {
    console.error('Add restaurant to cart error:', error);
    res.status(500).json({
      message: 'Failed to add restaurant to cart',
      error: error.message
    });
  }
};

// @desc    Get all options for a trip (transport, accommodation, restaurants) - Service function
// This can be called from other controllers
const getAllOptionsForTrip = async (tripId, userId, queryParams = {}) => {
  try {
    const { returnDate, adults = 1, rooms = 1, radius = 5000 } = queryParams;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: userId
    });

    if (!trip) {
      throw new Error('Trip not found or access denied');
    }

    // Get all options in parallel
    const [transportOptions, accommodationOptions, restaurants] = await Promise.allSettled([
      getAllTransportOptions(
        trip.originStation,
        trip.destination,
        trip.startDate.toISOString().split('T')[0],
        returnDate || null
      ),
      getAllAccommodationOptions(
        trip.destination,
        trip.startDate.toISOString().split('T')[0],
        trip.endDate.toISOString().split('T')[0],
        parseInt(adults),
        parseInt(rooms)
      ),
      getNearbyPlaces(
        trip.destination,
        'restaurant',
        parseInt(radius)
      )
    ]);

    return {
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          origin: trip.originStation,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate
        },
        options: {
          transport: transportOptions.status === 'fulfilled' ? transportOptions.value : { flights: [], trains: [], buses: [], summary: { totalOptions: 0 } },
          accommodation: accommodationOptions.status === 'fulfilled' ? accommodationOptions.value : { hotels: [], alternatives: [], summary: { totalOptions: 0 } },
          restaurants: {
            count: restaurants.status === 'fulfilled' ? restaurants.value.length : 0,
            results: restaurants.status === 'fulfilled' ? restaurants.value : []
          }
        }
      }
    };
  } catch (error) {
    console.error('Get all options error:', error);
    throw new Error('Failed to fetch all options');
  }
};

// @desc    Get all options for a trip (transport, accommodation, restaurants)
// @route   GET /api/options/:tripId/all
// @access  Private (requires JWT)
const getAllOptions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { returnDate, adults = 1, rooms = 1, radius = 5000 } = req.query;

    // Verify trip exists and user owns it
    const trip = await Trip.findOne({
      _id: tripId,
      userId: req.user._id
    });

    if (!trip) {
      return res.status(404).json({
        message: 'Trip not found or access denied'
      });
    }

    // Get all options in parallel
    const [transportOptions, accommodationOptions, restaurants] = await Promise.allSettled([
      getAllTransportOptions(
        trip.originStation,
        trip.destination,
        trip.startDate.toISOString().split('T')[0],
        returnDate || null
      ),
      getAllAccommodationOptions(
        trip.destination,
        trip.startDate.toISOString().split('T')[0],
        trip.endDate.toISOString().split('T')[0],
        parseInt(adults),
        parseInt(rooms)
      ),
      getNearbyPlaces(
        trip.destination,
        'restaurant',
        parseInt(radius)
      )
    ]);

    res.json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          title: trip.title,
          origin: trip.originStation,
          destination: trip.destination,
          startDate: trip.startDate,
          endDate: trip.endDate
        },
        options: {
          transport: transportOptions.status === 'fulfilled' ? transportOptions.value : { flights: [], trains: [], buses: [], summary: { totalOptions: 0 } },
          accommodation: accommodationOptions.status === 'fulfilled' ? accommodationOptions.value : { hotels: [], alternatives: [], summary: { totalOptions: 0 } },
          restaurants: {
            count: restaurants.status === 'fulfilled' ? restaurants.value.length : 0,
            results: restaurants.status === 'fulfilled' ? restaurants.value : []
          }
        }
      }
    });
  } catch (error) {
    console.error('Get all options error:', error);
    res.status(500).json({
      message: 'Failed to fetch all options',
      error: error.message
    });
  }
};

export {
  getTransportOptions,
  getAccommodationOptions,
  getRestaurantOptions,
  addTransportToCart,
  addAccommodationToCart,
  addRestaurantToCart,
  getAllOptions,
  getAllOptionsForTrip
};
