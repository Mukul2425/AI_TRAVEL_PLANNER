import express from 'express';
import { signup, login } from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/signup', signup);
router.post('/sign', signup);
router.post('/login', login);

export default router;
