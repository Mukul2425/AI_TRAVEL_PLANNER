# Quick Setup Guide

## Backend .env File
Create `backend/server/.env` with:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/wanderlust

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# AI Service
GEMINI_API_KEY=your_gemini_api_key_here

# Google API (Maps, Places, Geocoding, Directions)
GOOGLE_MAPS_API_KEY=your_google_api_key_here

# Amadeus API (Transport & Hotels) - Optional
# AMADEUS_CLIENT_ID=your_amadeus_client_id_here
# AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Frontend .env File
Create `frontend/.env` with:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```

## Required APIs
1. **Google Cloud Console**: Enable these APIs
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API

2. **Google AI Studio**: Get Gemini API key
   - Go to https://makersuite.google.com/app/apikey
   - Create API key

## Optional APIs
- **Amadeus**: For real flight/hotel data (can be added later)

## Start the Application
```bash
# Backend
cd backend/server
npm run dev

# Frontend
cd frontend
npm run dev
```

## Test Maps Integration
1. Login to your app
2. Go to any trip's itinerary view
3. Click "Show Map" button
4. Explore the map features!
