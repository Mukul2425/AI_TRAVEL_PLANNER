import express from 'express';
import { generateCompleteTravelPlanForTrip } from '../controllers/travelPlanController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generate complete travel plan (AI itinerary + external API data)
router.post('/generate', generateCompleteTravelPlanForTrip);

export default router;
