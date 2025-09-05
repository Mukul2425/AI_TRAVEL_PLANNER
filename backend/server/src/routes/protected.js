import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected route - requires valid JWT token
router.get('/profile', protect, (req, res) => {
  res.json({
    message: 'Access granted to protected route',
    user: req.user
  });
});

export default router;
