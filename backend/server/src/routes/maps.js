import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  geocodeLocation,
  getDirectionsBetweenPoints,
  getNearbyLocations,
  getPlaceInfo,
  calculateTripMetrics,
  getTripItineraryMap,
  getDayMap
} from '../controllers/mapsController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/maps/geocode
// @desc    Geocode an address to get coordinates
// @access  Private
router.post('/geocode', geocodeLocation);

// @route   POST /api/maps/directions
// @desc    Get directions between two points
// @access  Private
router.post('/directions', getDirectionsBetweenPoints);

// @route   POST /api/maps/nearby
// @desc    Get nearby places
// @access  Private
router.post('/nearby', getNearbyLocations);

// @route   GET /api/maps/place/:placeId
// @desc    Get place details by place ID
// @access  Private
router.get('/place/:placeId', getPlaceInfo);

// @route   POST /api/maps/trip-distance
// @desc    Calculate trip distance and duration
// @access  Private
router.post('/trip-distance', calculateTripMetrics);

// @route   POST /api/maps/trip/:tripId/itinerary-map
// @desc    Generate map data for a trip itinerary
// @access  Private
router.post('/trip/:tripId/itinerary-map', getTripItineraryMap);

// @route   POST /api/maps/trip/:tripId/day/:day/map
// @desc    Get map data for a specific day of itinerary
// @access  Private
router.post('/trip/:tripId/day/:day/map', getDayMap);

export default router;
