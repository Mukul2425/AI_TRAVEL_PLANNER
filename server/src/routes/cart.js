import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  addItemToCart,
  getCartItems,
  updateCartItem,
  removeCartItem,
  clearCart,
  getBudgetSummary,
  getUserCartsSummary
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Budget and summary routes (must come before tripId routes)
router.get('/summary', getUserCartsSummary);                  // Get all user's carts summary

// Cart management routes
router.post('/:tripId/add', addItemToCart);                    // Add item to cart
router.get('/:tripId', getCartItems);                          // Get cart items for a trip
router.patch('/:tripId/items/:itemId', updateCartItem);       // Update cart item
router.delete('/:tripId/items/:itemId', removeCartItem);      // Remove item from cart
router.delete('/:tripId/clear', clearCart);                   // Clear entire cart
router.get('/:tripId/budget', getBudgetSummary);              // Get budget summary for a trip

export default router;
