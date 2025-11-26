# Environment Setup Guide

## Required Environment Variables

To get real data instead of dummy data, you need to set up the following API keys in your `.env` file:

### 1. Gemini AI API Key (for itinerary generation)
```
GEMINI_API_KEY=your_gemini_api_key_here
```
**How to get it:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 2. Amadeus API Keys (for flights, trains, hotels)
```
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here
```
**How to get them:**
1. Go to [Amadeus for Developers](https://developers.amadeus.com/)
2. Sign up for a free account
3. Create a new application
4. Copy the Client ID and Client Secret

### 3. Google API Key (for maps, geocoding, directions, and places)
```
GOOGLE_MAPS_API_KEY=your_google_api_key_here
```
**How to get it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the generated key
6. (Optional) Restrict the API key to your domain for security

**Note**: You can use the same API key for all Google services (maps, places, geocoding, directions)

## Complete .env File Example

```env
# Database
MONGODB_URI=mongodb://localhost:27017/wanderlust

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# AI Service
GEMINI_API_KEY=your_gemini_api_key_here

# Amadeus API (Transport & Hotels)
AMADEUS_CLIENT_ID=your_amadeus_client_id_here
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret_here

# Google API (Maps, Places, Geocoding, Directions)
GOOGLE_MAPS_API_KEY=your_google_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Debug Information

When you make API calls, you'll see debug information in the console showing:

```
🔍 Transport API Debug Info:
  Origin: DEL
  Destination: Dharamshala
  Departure Date: 2025-09-05
  Return Date: null
  AMADEUS_CLIENT_ID: SET (or NOT SET)
  AMADEUS_CLIENT_SECRET: SET (or NOT SET)
```

## Testing Your Setup

1. **Test Transport API:**
   ```
   GET http://localhost:5000/api/options/{tripId}/transport
   ```

2. **Test Accommodation API:**
   ```
   GET http://localhost:5000/api/options/{tripId}/accommodation
   ```

3. **Test Restaurant API:**
   ```
   GET http://localhost:5000/api/options/{tripId}/restaurants
   ```

4. **Test Itinerary Generation:**
   ```
   POST http://localhost:5000/api/itineraries/generate
   ```

## Troubleshooting

### If you're still getting dummy data:

1. **Check your .env file** - Make sure it's in the `server/` directory
2. **Restart your server** - Environment variables are loaded on startup
3. **Check console logs** - Look for debug information about API keys
4. **Verify API keys** - Test them individually in their respective platforms

### Common Issues:

- **"NOT SET" in debug logs** → API key is missing from .env file
- **"SET" but still getting dummy data** → API key might be invalid or expired
- **Server won't start** → Check .env file syntax (no spaces around =)

## Cost Information

- **Gemini AI**: Free tier available, pay-per-use after limits
- **Amadeus**: Free tier available, pay-per-use after limits  
- **Google Places**: Free tier available, pay-per-use after limits

All APIs offer generous free tiers for development and testing.
