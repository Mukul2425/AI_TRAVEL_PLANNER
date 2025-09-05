import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI - will be set when needed
let genAI = null;

// Cache for storing generated itineraries (in-memory)
const itineraryCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Helper function to check if cache is valid
const isCacheValid = (cacheEntry) => {
  return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

// Helper function to create cache key
const createCacheKey = (destination, startDate, endDate, interests, budget, groupSize) => {
  return `itinerary_${destination}_${startDate}_${endDate}_${interests.join('_')}_${budget}_${groupSize}`;
};

// Get destination-specific content for enhanced mock itineraries
const getDestinationSpecificContent = (destination, interests) => {
  const dest = destination.toLowerCase();
  
  if (dest.includes('dharamshala') || dest.includes('mcleod ganj')) {
    return {
      summary: {
        destination: destination,
        duration: 5,
        totalEstimatedCost: "$300",
        highlights: [
          "Visit the Dalai Lama Temple Complex",
          "Explore Tibetan culture and monasteries",
          "Trek to Triund for stunning mountain views",
          "Experience authentic Tibetan cuisine"
        ],
        bestTimeToVisit: "March to June and September to November",
        localCurrency: "Indian Rupee (INR)",
        localInsights: [
          "Best time to visit monasteries is early morning for prayers",
          "Tibetan refugees have created a vibrant cultural scene",
          "Weather can change quickly in the mountains"
        ]
      },
      dailyActivities: [
        {
          morning: {
            activity: "Visit Namgyal Monastery and Dalai Lama Temple",
            activityType: "cultural",
            location: "Namgyal Monastery, McLeod Ganj",
            duration: "3 hours",
            cost: "$5",
            notes: "Experience morning prayers and meditation",
            bestTime: "6:00 AM - 9:00 AM",
            localTip: "Arrive early to witness the morning prayer ceremonies"
          },
          afternoon: {
            activity: "Explore Tibetan Institute of Performing Arts",
            activityType: "cultural",
            location: "TIPA, McLeod Ganj",
            duration: "2 hours",
            cost: "$8",
            notes: "Learn about Tibetan arts and culture",
            bestTime: "2:00 PM - 4:00 PM",
            localTip: "Check for cultural performances and workshops"
          },
          evening: {
            activity: "Sunset at Naddi View Point",
            activityType: "nature",
            location: "Naddi Village",
            duration: "2 hours",
            cost: "$3",
            notes: "Stunning views of Dhauladhar range",
            bestTime: "5:00 PM - 7:00 PM",
            localTip: "Bring warm clothes as it gets chilly at sunset"
          },
          meals: {
            breakfast: "Tibetan breakfast at Tibet Kitchen",
            lunch: "Momos at Tenzin's Restaurant",
            dinner: "Traditional Tibetan thukpa at Peace Cafe"
          },
          transportation: "Walking and shared taxi",
          totalDayCost: "$16",
          dayHighlights: ["Spiritual experience", "Cultural immersion", "Mountain views"],
          weatherContingency: "Visit indoor museums and cafes if weather is poor"
        },
        {
          morning: {
            activity: "Trek to Triund Hill",
            activityType: "adventure",
            location: "Triund Trek, McLeod Ganj",
            duration: "4 hours",
            cost: "$10",
            notes: "Moderate trek with spectacular views",
            bestTime: "7:00 AM - 11:00 AM",
            localTip: "Start early to avoid afternoon heat and crowds"
          },
          afternoon: {
            activity: "Explore Bhagsu Waterfall",
            activityType: "nature",
            location: "Bhagsu Village",
            duration: "2 hours",
            cost: "$2",
            notes: "Relaxing waterfall and temple visit",
            bestTime: "1:00 PM - 3:00 PM",
            localTip: "Wear comfortable shoes for the walk to the waterfall"
          },
          evening: {
            activity: "Tibetan Market Shopping",
            activityType: "shopping",
            location: "McLeod Ganj Market",
            duration: "2 hours",
            cost: "$15",
            notes: "Buy Tibetan handicrafts and souvenirs",
            bestTime: "5:00 PM - 7:00 PM",
            localTip: "Bargain politely and support local artisans"
          },
          meals: {
            breakfast: "Tibetan bread and butter tea",
            lunch: "Local dhaba meal",
            dinner: "Tibetan hot pot at Snow Lion Restaurant"
          },
          transportation: "Walking and local bus",
          totalDayCost: "$27",
          dayHighlights: ["Mountain trekking", "Natural beauty", "Local shopping"],
          weatherContingency: "Visit indoor markets and cafes if weather is poor"
        },
        {
          morning: {
            activity: "Visit Tsechokling Monastery",
            activityType: "cultural",
            location: "Tsechokling Monastery, McLeod Ganj",
            duration: "2 hours",
            cost: "$3",
            notes: "Lesser-known monastery with peaceful atmosphere",
            bestTime: "8:00 AM - 10:00 AM",
            localTip: "This monastery is quieter and perfect for meditation"
          },
          afternoon: {
            activity: "Cooking Class at Tibet Kitchen",
            activityType: "cultural",
            location: "Tibet Kitchen, McLeod Ganj",
            duration: "3 hours",
            cost: "$20",
            notes: "Learn to make authentic Tibetan momos and thukpa",
            bestTime: "11:00 AM - 2:00 PM",
            localTip: "Book in advance as classes fill up quickly"
          },
          evening: {
            activity: "St. John's Church in the Wilderness",
            activityType: "historical",
            location: "St. John's Church, McLeod Ganj",
            duration: "1.5 hours",
            cost: "$2",
            notes: "Historic church with beautiful architecture",
            bestTime: "4:00 PM - 5:30 PM",
            localTip: "Visit during golden hour for beautiful photos"
          },
          meals: {
            breakfast: "Local paratha and chai",
            lunch: "Cooking class meal",
            dinner: "Tibetan restaurant with mountain view"
          },
          transportation: "Walking",
          totalDayCost: "$25",
          dayHighlights: ["Cultural learning", "Cooking experience", "Historical sites"],
          weatherContingency: "Indoor cooking class and museum visits"
        },
        {
          morning: {
            activity: "Day trip to Dharamkot",
            activityType: "nature",
            location: "Dharamkot Village",
            duration: "3 hours",
            cost: "$8",
            notes: "Scenic village with yoga and meditation centers",
            bestTime: "7:00 AM - 10:00 AM",
            localTip: "Take the scenic walking route through pine forests"
          },
          afternoon: {
            activity: "Visit Kangra Art Museum",
            activityType: "cultural",
            location: "Kangra Art Museum, Dharamshala",
            duration: "2 hours",
            cost: "$5",
            notes: "Explore local art and cultural artifacts",
            bestTime: "12:00 PM - 2:00 PM",
            localTip: "Don't miss the miniature paintings collection"
          },
          evening: {
            activity: "Evening meditation session",
            activityType: "spiritual",
            location: "Tushita Meditation Centre",
            duration: "1.5 hours",
            cost: "$5",
            notes: "Guided meditation in peaceful surroundings",
            bestTime: "6:00 PM - 7:30 PM",
            localTip: "Arrive 15 minutes early to settle in"
          },
          meals: {
            breakfast: "Healthy breakfast at Dharamkot cafe",
            lunch: "Museum cafe or local restaurant",
            dinner: "Light vegetarian meal at meditation center"
          },
          transportation: "Shared taxi and walking",
          totalDayCost: "$18",
          dayHighlights: ["Nature walk", "Art appreciation", "Spiritual practice"],
          weatherContingency: "Indoor museum and meditation center activities"
        },
        {
          morning: {
            activity: "Final shopping at Tibetan Handicraft Center",
            activityType: "shopping",
            location: "Tibetan Handicraft Center, McLeod Ganj",
            duration: "2 hours",
            cost: "$20",
            notes: "Buy authentic Tibetan crafts and souvenirs",
            bestTime: "9:00 AM - 11:00 AM",
            localTip: "Support local artisans and get unique pieces"
          },
          afternoon: {
            activity: "Relaxing time at local cafes",
            activityType: "leisure",
            location: "McLeod Ganj cafes",
            duration: "2 hours",
            cost: "$10",
            notes: "Enjoy final moments with mountain views",
            bestTime: "1:00 PM - 3:00 PM",
            localTip: "Try different cafes for variety of views and atmosphere"
          },
          evening: {
            activity: "Farewell dinner with cultural show",
            activityType: "cultural",
            location: "Local restaurant with cultural performance",
            duration: "2 hours",
            cost: "$25",
            notes: "Traditional Tibetan dinner with cultural entertainment",
            bestTime: "6:00 PM - 8:00 PM",
            localTip: "Book in advance for the best cultural show experience"
          },
          meals: {
            breakfast: "Final Tibetan breakfast",
            lunch: "Cafe hopping for different experiences",
            dinner: "Special farewell dinner with cultural show"
          },
          transportation: "Walking",
          totalDayCost: "$55",
          dayHighlights: ["Final shopping", "Relaxation", "Cultural celebration"],
          weatherContingency: "Indoor cafes and restaurants with cultural shows"
        }
      ],
      recommendations: {
        packing: [
          "Warm layers and rain jacket",
          "Comfortable trekking shoes",
          "Sun hat and sunglasses",
          "Camera for mountain views",
          "Cash in Indian Rupees"
        ],
        tips: [
          "Acclimatize to altitude gradually",
          "Respect local customs and monasteries",
          "Carry water and snacks for treks",
          "Learn basic Tibetan greetings"
        ],
        alternatives: [
          "Indoor meditation centers",
          "Tibetan cooking classes",
          "Local art galleries",
          "Cafes with mountain views"
        ],
        localCustoms: [
          "Remove shoes before entering temples",
          "Dress modestly in religious places",
          "Don't point feet towards people or religious objects"
        ],
        safetyTips: [
          "Inform someone about trek plans",
          "Carry first aid kit for treks",
          "Stay hydrated at high altitude"
        ],
        hiddenGems: [
          "Tsechokling Monastery",
          "St. John's Church in the Wilderness",
          "Local Tibetan refugee settlements"
        ],
        localFoods: [
          "Tibetan momos (dumplings)",
          "Thukpa (noodle soup)",
          "Butter tea",
          "Tibetan bread"
        ],
        photographySpots: [
          "Dalai Lama Temple complex",
          "Triund Hill summit",
          "Naddi sunset point",
          "Bhagsu Waterfall"
        ]
      },
      practicalInfo: {
        bestTransportation: "Walking, shared taxis, and local buses",
        localLanguage: "Hindi, English, and Tibetan",
        tippingCulture: "Not expected but appreciated in restaurants",
        emergencyContacts: "Local police: 100, Medical: 108",
        localApps: ["Google Maps", "Local taxi apps", "Weather apps"]
      }
    };
  }
  
  // Default content for other destinations
  return {
    summary: {
      destination: destination,
      duration: 5,
      totalEstimatedCost: "$300",
      highlights: [
        "Local exploration and culture",
        "Culinary experiences",
        "Historical sites",
        "Local markets and shopping"
      ],
      bestTimeToVisit: "Year-round",
      localCurrency: "Local currency",
      localInsights: [
        "Best time to visit attractions is early morning",
        "Local markets offer authentic experiences",
        "Public transport is efficient and affordable"
      ]
    },
    dailyActivities: [
      {
        morning: {
          activity: `Explore ${destination} highlights`,
          activityType: "sightseeing",
          location: "City center",
          duration: "3 hours",
          cost: "$15",
          notes: "Start your day with local exploration",
          bestTime: "9:00 AM - 12:00 PM",
          localTip: "Visit early to avoid crowds and get the best photos"
        },
        afternoon: {
          activity: "Local cuisine experience",
          activityType: "dining",
          location: "Downtown area",
          duration: "2 hours",
          cost: "$25",
          notes: "Try local specialties",
          bestTime: "1:00 PM - 3:00 PM",
          localTip: "Ask locals for their favorite hidden gem restaurants"
        },
        evening: {
          activity: "Cultural activity",
          activityType: "cultural",
          location: "City center",
          duration: "2 hours",
          cost: "$20",
          notes: "Immerse in local culture",
          bestTime: "6:00 PM - 8:00 PM",
          localTip: "Check local event calendars for special cultural events"
        },
        meals: {
          breakfast: "Hotel breakfast or local cafe",
          lunch: "Traditional local restaurant",
          dinner: "Fine dining experience with local cuisine"
        },
        transportation: "Public transport and walking",
        totalDayCost: "$60",
        dayHighlights: ["Authentic local experiences", "Cultural immersion", "Photography opportunities"],
        weatherContingency: "Indoor museum and shopping alternatives available"
      }
    ],
    recommendations: {
      packing: [
        "Comfortable walking shoes",
        "Weather-appropriate clothing",
        "Camera for memories",
        "Local currency",
        "Universal adapter"
      ],
      tips: [
        "Start early to avoid crowds",
        "Learn basic local phrases",
        "Keep emergency contacts handy",
        "Respect local customs",
        "Download offline maps"
      ],
      alternatives: [
        "Indoor activities for bad weather",
        "Alternative dining options",
        "Backup transportation plans",
        "Flexible activity scheduling"
      ],
      localCustoms: [
        "Respect local dress codes",
        "Learn basic greetings",
        "Follow local dining etiquette"
      ],
      safetyTips: [
        "Keep valuables secure",
        "Stay in well-lit areas at night",
        "Have emergency contacts ready"
      ],
      hiddenGems: [
        "Local neighborhood cafes",
        "Off-the-beaten-path viewpoints",
        "Traditional craft workshops"
      ],
      localFoods: [
        "Traditional breakfast specialties",
        "Street food favorites",
        "Local dessert traditions"
      ],
      photographySpots: [
        "Historic architecture",
        "Local markets",
        "Scenic viewpoints"
      ]
    },
    practicalInfo: {
      bestTransportation: "Public transport and walking",
      localLanguage: "Local language with English widely spoken",
      tippingCulture: "10-15% in restaurants, round up for taxis",
      emergencyContacts: "Local emergency numbers",
      localApps: ["Local transport app", "Tourism app", "Translation app"]
    }
  };
};

// Helper function to format the AI prompt - Persona-driven for rich, detailed itineraries
const formatPrompt = (inputs) => {
  const { destination, startDate, endDate, interests, budget, groupSize } = inputs;
  
  // Calculate trip duration
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Extract city/country for more specific guidance
  const destinationParts = destination.split(',');
  const city = destinationParts[0].trim();
  const country = destinationParts[1] ? destinationParts[1].trim() : '';

  return `You are a knowledgeable and enthusiastic local tourist guide for ${destination}. Your task is to generate a comprehensive ${duration}-day itinerary for a traveler interested in ${interests.join(', ')}.

For each day, please include the following:

A specific, fully-planned morning, afternoon, and evening activity.
The exact name of each place to visit, along with a brief description.
An estimated duration and cost for each activity.
A specific recommendation for breakfast, lunch, and dinner, including the name of a local restaurant or cafe.
Recommended transportation (e.g., walking, taxi, local bus, metro).
Any useful tips for that day's plan.

Trip Details:
- Destination: ${destination}
- Dates: ${startDate} to ${endDate}
- Duration: ${duration} days
- Group Size: ${groupSize || 1} person(s)
- Budget Level: ${budget || 'Flexible'}
- Primary Interests: ${interests.join(', ')}

IMPORTANT: Act as a true local expert who knows the hidden gems, best times to visit attractions, local customs, and insider tips. Provide specific venue names, realistic costs, and practical advice.

Format the response as a valid JSON object with this structure:
{
  "summary": {
    "destination": "string",
    "duration": "number",
    "totalEstimatedCost": "string",
    "highlights": ["string"],
    "bestTimeToVisit": "string",
    "localCurrency": "string",
    "localInsights": ["string"]
  },
  "dailyPlans": [
    {
      "day": "number",
      "date": "string",
      "morning": {
        "activity": "string",
        "activityType": "string",
        "location": "string",
        "duration": "string",
        "cost": "string",
        "notes": "string",
        "bestTime": "string",
        "localTip": "string"
      },
      "afternoon": {
        "activity": "string",
        "activityType": "string",
        "location": "string",
        "duration": "string",
        "cost": "string",
        "notes": "string",
        "bestTime": "string",
        "localTip": "string"
      },
      "evening": {
        "activity": "string",
        "activityType": "string",
        "location": "string",
        "duration": "string",
        "cost": "string",
        "notes": "string",
        "bestTime": "string",
        "localTip": "string"
      },
      "meals": {
        "breakfast": "string",
        "lunch": "string",
        "dinner": "string"
      },
      "transportation": "string",
      "totalDayCost": "string",
      "dayHighlights": ["string"],
      "weatherContingency": "string"
    }
  ],
  "recommendations": {
    "packing": ["string"],
    "tips": ["string"],
    "alternatives": ["string"],
    "localCustoms": ["string"],
    "safetyTips": ["string"],
    "hiddenGems": ["string"],
    "localFoods": ["string"],
    "photographySpots": ["string"]
  },
  "practicalInfo": {
    "bestTransportation": "string",
    "localLanguage": "string",
    "tippingCulture": "string",
    "emergencyContacts": "string",
    "localApps": ["string"]
  },
  "externalServices": {
    "transportNote": "Transport options will be provided by external APIs",
    "accommodationNote": "Hotel options will be provided by external APIs",
    "restaurantNote": "Restaurant options will be provided by external APIs"
  }
}

Ensure the response is valid JSON and follows the exact structure above. Be specific with venue names, realistic costs, and provide insider knowledge that only a local would know.`;
};

// Helper function to clean and validate AI response
const cleanAIResponse = (response) => {
  try {
    // Extract JSON from the response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.summary || !parsed.dailyPlans || !Array.isArray(parsed.dailyPlans)) {
      throw new Error('Invalid itinerary structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
};

// Generate itinerary using AI - Focus only on structure and activities
export const generateItinerary = async (inputs) => {
  try {
    // Get API key at runtime
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // AI Service generating itinerary

    // Build cache key
    const cacheKey = createCacheKey(
      inputs.destination, 
      inputs.startDate, 
      inputs.endDate, 
      inputs.interests, 
      inputs.budget, 
      inputs.groupSize
    );
    
    // Bypass cache if force refresh requested
    const forceRefresh = Boolean(inputs?.forceRefresh);
    const cachedResult = itineraryCache.get(cacheKey);
    if (!forceRefresh && isCacheValid(cachedResult)) {
      return cachedResult.data;
    }

    // Check if we have API key
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.error('GEMINI_API_KEY missing or placeholder. Cannot generate itinerary.');
      throw new Error('AI itinerary generation is not configured');
    }

    // Initialize Gemini AI client
    if (!genAI) {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }

    // Generate prompt - Only pass basic inputs, no external API data
    const prompt = formatPrompt(inputs);
    
    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate content
    console.log('[Gemini] Generating itinerary with model gemini-1.5-flash');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and validate response
    const cleanedItinerary = cleanAIResponse(text);
    
    // Cache the result
    itineraryCache.set(cacheKey, {
      data: cleanedItinerary,
      timestamp: Date.now()
    });
    
    return cleanedItinerary;
  } catch (error) {
    console.error('Error generating itinerary via Gemini:', error?.message || error);
    throw error;
  }
};

// Mock generation removed to ensure failures surface clearly

// Generate alternative itinerary based on weather or preferences
export const generateAlternativeItinerary = async (originalItinerary, constraints) => {
  try {
    // Get API key at runtime
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('AI itinerary generation is not configured. Please set GEMINI_API_KEY in your environment variables.');
    }

    // Initialize Gemini AI client
    if (!genAI) {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }

    const prompt = `Based on this original itinerary:
${JSON.stringify(originalItinerary, null, 2)}

Generate an alternative plan considering these constraints:
${JSON.stringify(constraints, null, 2)}

IMPORTANT: Focus ONLY on changing activities and timing. DO NOT recommend specific transport, hotels, or restaurants. External APIs will handle those details.

Provide the same JSON structure but with alternative activities that fit the constraints.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return cleanAIResponse(text);
  } catch (error) {
    console.error('Error generating alternative itinerary:', error);
    throw new Error('Failed to generate alternative itinerary. Please try again later.');
  }
};

// Validate itinerary structure
export const validateItinerary = (itinerary) => {
  try {
    const required = ['summary', 'dailyPlans', 'recommendations'];
    const summaryRequired = ['destination', 'duration', 'totalEstimatedCost', 'highlights'];
    const dayRequired = ['day', 'date', 'morning', 'afternoon', 'evening', 'meals', 'totalDayCost'];
    const activityRequired = ['activity', 'activityType', 'location', 'duration', 'cost', 'notes'];
    
    // Check top-level structure
    for (const field of required) {
      if (!itinerary[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }
    
    // Check summary structure
    for (const field of summaryRequired) {
      if (!itinerary.summary[field]) {
        return { valid: false, error: `Missing required summary field: ${field}` };
      }
    }
    
    // Check daily plans structure
    if (!Array.isArray(itinerary.dailyPlans) || itinerary.dailyPlans.length === 0) {
      return { valid: false, error: 'Daily plans must be a non-empty array' };
    }
    
    for (const day of itinerary.dailyPlans) {
      for (const field of dayRequired) {
        if (!day[field]) {
          return { valid: false, error: `Missing required day field: ${field}` };
        }
      }
      
      // Check activity structure for each time slot
      const timeSlots = ['morning', 'afternoon', 'evening'];
      for (const timeSlot of timeSlots) {
        if (day[timeSlot]) {
          for (const field of activityRequired) {
            if (!day[timeSlot][field]) {
              return { valid: false, error: `Missing required ${timeSlot} activity field: ${field}` };
            }
          }
        }
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error.message}` };
  }
};
