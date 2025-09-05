# WanderLust Trip Options API Documentation

This document explains how to use the new trip options API that allows users to search for transport, accommodation, and restaurant options for their trips and add them to their cart.

## Overview

The options API provides endpoints to:
1. **Search for transport options** (flights, trains, buses) between origin and destination
2. **Search for accommodation options** (hotels, hostels, vacation rentals) at the destination
3. **Search for restaurant options** near the destination
4. **Add selected options to cart** for easy booking management
5. **Get all options at once** for comprehensive trip planning

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 1. Get All Options for a Trip

**GET** `/api/options/:tripId/all`

Get transport, accommodation, and restaurant options for a specific trip.

**Query Parameters:**
- `returnDate` (optional): Return date for round-trip transport
- `adults` (optional, default: 1): Number of adults for accommodation
- `rooms` (optional, default: 1): Number of rooms needed
- `radius` (optional, default: 5000): Search radius for restaurants in meters

**Example Request:**
```bash
GET /api/options/64f8a1b2c3d4e5f6a7b8c9d0/all?adults=2&rooms=1&radius=3000
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Goa Beach Vacation",
      "origin": "DEL",
      "destination": "GOI",
      "startDate": "2025-06-01T00:00:00.000Z",
      "endDate": "2025-06-10T00:00:00.000Z"
    },
    "options": {
      "transport": {
        "flights": [
          {
            "id": "flight_123",
            "price": { "total": "150.00", "currency": "USD" },
            "departure": { "airport": "DEL", "time": "2025-06-01T08:00:00Z" },
            "arrival": { "airport": "GOI", "time": "2025-06-01T10:30:00Z" },
            "duration": "PT2H30M",
            "segments": 1,
            "airline": "AI",
            "cabinClass": "Economy"
          }
        ],
        "trains": [],
        "buses": [
          {
            "id": "bus_456",
            "price": { "total": "25.00", "currency": "USD" },
            "departure": { "station": "DEL", "time": "2025-06-01T08:00:00Z" },
            "arrival": { "station": "GOI", "time": "2025-06-01T12:00:00Z" },
            "duration": "PT4H",
            "segments": 1,
            "carrier": "Bus Company"
          }
        ],
        "summary": { "totalOptions": 2 }
      },
      "accommodation": {
        "hotels": [
          {
            "id": "hotel_789",
            "name": "Goa Beach Resort",
            "rating": 4.2,
            "location": {
              "city": "Goa",
              "country": "IN",
              "latitude": 15.2993,
              "longitude": 74.1240
            },
            "offers": [
              {
                "id": "offer_123",
                "roomType": "Standard Room",
                "boardType": "Room Only",
                "price": {
                  "total": "80.00",
                  "currency": "USD",
                  "base": "75.00",
                  "taxes": "5.00"
                },
                "cancellation": "Free cancellation up to 24h before",
                "amenities": ["WiFi", "AC", "TV"]
              }
            ]
          }
        ],
        "alternatives": [],
        "summary": {
          "totalOptions": 1,
          "location": "GOI",
          "checkIn": "2025-06-01",
          "checkOut": "2025-06-10"
        }
      },
      "restaurants": {
        "count": 15,
        "results": [
          {
            "id": "restaurant_123",
            "name": "Beachside Cafe",
            "rating": 4.5,
            "userRatingsTotal": 150,
            "priceLevel": 2,
            "types": ["restaurant", "food", "establishment"],
            "vicinity": "Beach Road, Goa",
            "geometry": {
              "location": { "lat": 15.2993, "lng": 74.1240 }
            }
          }
        ]
      }
    }
  }
}
```

### 2. Get Transport Options

**GET** `/api/options/:tripId/transport`

Get only transport options for a trip.

**Query Parameters:**
- `returnDate` (optional): Return date for round-trip

**Example Request:**
```bash
GET /api/options/64f8a1b2c3d4e5f6a7b8c9d0/transport?returnDate=2025-06-10
```

### 3. Add Transport to Cart

**POST** `/api/options/:tripId/transport/add-to-cart`

Add a selected transport option to the trip's cart.

**Request Body:**
```json
{
  "transportType": "flight",
  "transportId": "flight_123",
  "transportName": "Air India AI-123",
  "price": {
    "total": "150.00",
    "currency": "USD"
  },
  "departureTime": "2025-06-01T08:00:00Z",
  "arrivalTime": "2025-06-01T10:30:00Z",
  "duration": "PT2H30M",
  "details": {
    "airline": "AI",
    "cabinClass": "Economy"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Transport added to cart successfully",
  "data": {
    "_id": "cart_item_123",
    "userId": "user_456",
    "tripId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "itemType": "transport",
    "itemName": "FLIGHT: Air India AI-123",
    "itemId": "flight_123",
    "price": {
      "amount": 150.00,
      "currency": "USD"
    },
    "quantity": 1,
    "duration": "1 journey",
    "date": "2025-06-01T08:00:00.000Z",
    "details": {
      "transportType": "flight",
      "departureTime": "2025-06-01T08:00:00Z",
      "arrivalTime": "2025-06-01T10:30:00Z",
      "duration": "PT2H30M",
      "airline": "AI",
      "cabinClass": "Economy"
    }
  }
}
```

### 4. Get Accommodation Options

**GET** `/api/options/:tripId/accommodation`

Get accommodation options at the trip destination.

**Query Parameters:**
- `adults` (optional, default: 1): Number of adults
- `rooms` (optional, default: 1): Number of rooms

**Example Request:**
```bash
GET /api/options/64f8a1b2c3d4e5f6a7b8c9d0/accommodation?adults=2&rooms=1
```

### 5. Add Accommodation to Cart

**POST** `/api/options/:tripId/accommodation/add-to-cart`

Add a selected accommodation option to the trip's cart.

**Request Body:**
```json
{
  "accommodationType": "hotel",
  "accommodationId": "hotel_789",
  "accommodationName": "Goa Beach Resort",
  "offerId": "offer_123",
  "price": {
    "total": "80.00",
    "currency": "USD"
  },
  "checkIn": "2025-06-01",
  "checkOut": "2025-06-10",
  "roomType": "Standard Room",
  "boardType": "Room Only",
  "details": {
    "amenities": ["WiFi", "AC", "TV"]
  }
}
```

### 6. Get Restaurant Options

**GET** `/api/options/:tripId/restaurants`

Get restaurant options near the trip destination.

**Query Parameters:**
- `radius` (optional, default: 5000): Search radius in meters
- `query` (optional): Specific search query

**Example Request:**
```bash
GET /api/options/64f8a1b2c3d4e5f6a7b8c9d0/restaurants?radius=3000&query=seafood
```

### 7. Add Restaurant to Cart

**POST** `/api/options/:tripId/restaurants/add-to-cart`

Add a selected restaurant option to the trip's cart.

**Request Body:**
```json
{
  "restaurantId": "restaurant_123",
  "restaurantName": "Beachside Cafe",
  "price": "25.00",
  "date": "2025-06-02T19:00:00Z",
  "mealType": "dinner",
  "partySize": 2,
  "details": {
    "cuisine": "seafood",
    "reservation": true
  }
}
```

## Cart Management

Once items are added to the cart, you can manage them using the existing cart endpoints:

### View Cart Items
**GET** `/api/cart/:tripId`

### Update Cart Item
**PATCH** `/api/cart/:tripId/items/:itemId`

### Remove Cart Item
**DELETE** `/api/cart/:tripId/items/:itemId`

### Get Budget Summary
**GET** `/api/cart/:tripId/budget`

### Clear Entire Cart
**DELETE** `/api/cart/:tripId/clear`

## Complete Workflow Example

Here's a complete example of how to use the options API:

### 1. Create a Trip
```bash
POST /api/trips
{
  "title": "Goa Beach Vacation",
  "destination": "GOI",
  "originStation": "DEL",
  "startDate": "2025-06-01",
  "endDate": "2025-06-10"
}
```

### 2. Get All Options
```bash
GET /api/options/64f8a1b2c3d4e5f6a7b8c9d0/all?adults=2&rooms=1
```

### 3. Add Transport to Cart
```bash
POST /api/options/64f8a1b2c3d4e5f6a7b8c9d0/transport/add-to-cart
{
  "transportType": "flight",
  "transportId": "flight_123",
  "transportName": "Air India AI-123",
  "price": { "total": "150.00", "currency": "USD" },
  "departureTime": "2025-06-01T08:00:00Z",
  "arrivalTime": "2025-06-01T10:30:00Z",
  "duration": "PT2H30M"
}
```

### 4. Add Hotel to Cart
```bash
POST /api/options/64f8a1b2c3d4e5f6a7b8c9d0/accommodation/add-to-cart
{
  "accommodationType": "hotel",
  "accommodationId": "hotel_789",
  "accommodationName": "Goa Beach Resort",
  "price": { "total": "80.00", "currency": "USD" },
  "checkIn": "2025-06-01",
  "checkOut": "2025-06-10",
  "roomType": "Standard Room",
  "boardType": "Room Only"
}
```

### 5. Add Restaurant to Cart
```bash
POST /api/options/64f8a1b2c3d4e5f6a7b8c9d0/restaurants/add-to-cart
{
  "restaurantId": "restaurant_123",
  "restaurantName": "Beachside Cafe",
  "price": "25.00",
  "date": "2025-06-02T19:00:00Z",
  "mealType": "dinner",
  "partySize": 2
}
```

### 6. View Cart and Budget
```bash
GET /api/cart/64f8a1b2c3d4e5f6a7b8c9d0
GET /api/cart/64f8a1b2c3d4e5f6a7b8c9d0/budget
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created (for cart additions)
- `400`: Bad Request (missing required fields)
- `401`: Unauthorized (invalid or missing token)
- `404`: Not Found (trip not found or access denied)
- `500`: Internal Server Error

Error responses include a message and details:
```json
{
  "message": "Trip not found or access denied"
}
```

## Rate Limiting

Some endpoints may have rate limiting to prevent abuse. Check the response headers for rate limit information.

## Notes

- All prices are returned in USD by default
- Dates should be in ISO 8601 format
- Transport options include flights, trains, and buses (where available)
- Accommodation options include hotels and alternative accommodations
- Restaurant search uses Google Places API (requires GOOGLE_API_KEY)
- Transport and accommodation search use Amadeus API (requires AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET)
- Results are cached to improve performance and reduce API calls
