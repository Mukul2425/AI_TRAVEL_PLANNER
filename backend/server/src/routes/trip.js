import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  updateTripStatus
} from '../controllers/tripController.js';
import { getItineraryByTripId } from '../controllers/itineraryController.js';

const router = express.Router();

// All trip routes require authentication
router.use(protect);

// Trip CRUD routes
router.post('/', createTrip);           // Create trip
router.get('/', getTrips);              // Get all trips
router.get('/:id', getTripById);        // Get trip by ID
router.get('/:id/itinerary', getItineraryByTripId); // Get itinerary by Trip ID
router.patch('/:id', updateTrip);       // Update trip
router.patch('/:id/status', updateTripStatus); // Update trip status
router.delete('/:id', deleteTrip);      // Delete trip

export default router;
