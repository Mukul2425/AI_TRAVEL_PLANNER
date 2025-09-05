# WanderLust Backend Server

This is the backend API server for the WanderLust travel application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/wanderlust
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
       GOOGLE_API_KEY=your_google_places_api_key_here
    AMADEUS_CLIENT_ID=your_amadeus_client_id_here
    AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
    GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Make sure MongoDB is running locally or update the MONGODB_URI

## Running the Server

### Development (with auto-restart):
```bash
npm run dev
```

### Production:
```bash
npm start
```

## Project Structure

```
src/
├── config/        # Database connection, environment setup
├── controllers/   # Request handlers
├── models/        # MongoDB schemas
├── routes/        # API routes
├── middlewares/   # Authentication, error handlers
├── services/      # External APIs, AI calls
├── utils/         # Helper functions
└── index.js       # Entry point
```

## API Endpoints

### Public Routes
- `GET /` - Welcome message

### Authentication Routes
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication

### Protected Routes
- `GET /api/protected/profile` - User profile (requires JWT)

### Trip Management Routes (requires JWT)
- `POST /api/trips` - Create a new trip
- `GET /api/trips` - Get all user's trips
- `GET /api/trips/:id` - Get specific trip by ID
- `PATCH /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

**Trip Model Fields:**
- `title` (required) - Trip title (max 100 characters)
- `destination` (required) - Trip destination (max 100 characters)
- `originStation` (required) - Starting point/origin station (max 100 characters)
- `startDate` (required) - Trip start date
- `endDate` (required) - Trip end date
- `selections` (optional) - Object containing transport, accommodation, and dining preferences

### External API Integration Routes (requires JWT)
- `GET /api/options/transports` - Get transport options (flights, trains, buses)
- `GET /api/options/accommodations` - Get accommodation options (hotels, hostels)
- `GET /api/options/accommodations/:hotelId` - Get hotel details
- `GET /api/options/places` - Get nearby places (restaurants, attractions)
- `GET /api/options/places/:placeId` - Get place details
- `GET /api/options/all` - Get all options for a trip (comprehensive search)

### AI Itinerary Generation Routes (requires JWT)
- `POST /api/itineraries/generate` - Generate AI itinerary for a trip
- `GET /api/itineraries` - Get user's itineraries
- `GET /api/itineraries/:id` - Get specific itinerary by ID
- `POST /api/itineraries/:id/alternatives` - Generate alternative itinerary
- `PATCH /api/itineraries/:id/status` - Update itinerary status
- `POST /api/itineraries/:id/feedback` - Submit itinerary feedback
- `DELETE /api/itineraries/:id` - Delete itinerary

### Cart & Budget Management Routes (requires JWT)
- `POST /api/cart/:tripId/add` - Add item to cart
- `GET /api/cart/:tripId` - Get cart items for a trip
- `PATCH /api/cart/:tripId/items/:itemId` - Update cart item
- `DELETE /api/cart/:tripId/items/:itemId` - Remove item from cart
- `DELETE /api/cart/:tripId/clear` - Clear entire cart
- `GET /api/cart/:tripId/budget` - Get budget summary for a trip
- `GET /api/cart/summary` - Get all user's carts summary

**Cart Item Types:** hotel, transport, activity, restaurant, attraction
**Supported Currencies:** USD, EUR, GBP, INR, CAD, AUD, JPY, CNY

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **axios** - HTTP client for external APIs
- **express-rate-limit** - Rate limiting for API protection
- **@google/generative-ai** - Google Gemini AI integration
- **nodemon** - Development auto-restart (dev dependency)

## Module System

This project uses **ES Modules** (ESM) instead of CommonJS. All imports/exports use the modern ES6 syntax.
