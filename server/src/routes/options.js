import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getTransportOptions,
  getAccommodationOptions,
  getRestaurantOptions,
  addTransportToCart,
  addAccommodationToCart,
  addRestaurantToCart,
  getAllOptions
} from '../controllers/optionsController.js';

const router = express.Router();

// All options routes require authentication
router.use(protect);

// Get all options for a trip
router.get('/:tripId/all', getAllOptions);

// Transport options
router.get('/:tripId/transport', getTransportOptions);
router.post('/:tripId/transport/add-to-cart', addTransportToCart);

// Accommodation options
router.get('/:tripId/accommodation', getAccommodationOptions);
router.post('/:tripId/accommodation/add-to-cart', addAccommodationToCart);

// Restaurant options
router.get('/:tripId/restaurants', getRestaurantOptions);
router.post('/:tripId/restaurants/add-to-cart', addRestaurantToCart);

export default router;
