# Frontend Environment Setup

Create a `.env` (or `.env.local`) in the project root with:

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_google_api_key_here
```

**How to get Google API Key:**
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

**Note**: Use the same API key for both frontend and backend

Restart the dev server after changes to env variables.
