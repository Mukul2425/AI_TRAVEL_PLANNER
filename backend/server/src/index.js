import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import protectedRoutes from './routes/protected.js';
import tripRoutes from './routes/trip.js';
import optionsRoutes from './routes/options.js';
import itineraryRoutes from './routes/itinerary.js';
import cartRoutes from './routes/cart.js';
import travelPlanRoutes from './routes/travelPlan.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // alias to support /auth/sign
app.use('/api/protected', protectedRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/options', optionsRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/travel-plans', travelPlanRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to WanderLust API' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
