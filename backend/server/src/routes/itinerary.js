import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { apiRateLimit } from '../middlewares/rateLimitMiddleware.js';
import {
  generateItineraryForTrip,
  getUserItineraries,
  getItineraryById,
  generateAlternativeItineraryForTrip,
  updateItineraryStatus,
  provideItineraryFeedback,
  customizeItinerary,
  getCustomizedItinerary,
  addCustomNote,
  resetCustomization,
  deleteItinerary
} from '../controllers/itineraryController.js';

const router = express.Router();

// All itinerary routes require authentication
router.use(protect);

// Apply rate limiting to AI-intensive operations
router.use('/generate', apiRateLimit);
router.use('/:id/alternatives', apiRateLimit);

// Itinerary CRUD routes
router.post('/generate', generateItineraryForTrip);           // Generate new itinerary
router.get('/', getUserItineraries);                          // Get user's itineraries
router.get('/:id', getItineraryById);                        // Get specific itinerary
router.get('/:id/customized', getCustomizedItinerary);       // Get itinerary with customizations
router.post('/:id/alternatives', generateAlternativeItineraryForTrip); // Generate alternative
router.patch('/:id/status', updateItineraryStatus);          // Update status
router.patch('/:id/customize', customizeItinerary);          // Customize specific time slot
router.post('/:id/notes', addCustomNote);                    // Add custom note
router.post('/:id/feedback', provideItineraryFeedback);      // Submit feedback
router.delete('/:id/customizations/:modificationId', resetCustomization); // Reset customization
router.delete('/:id', deleteItinerary);                      // Delete itinerary

export default router;
