export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium: boolean;
  goldenMiles: number;
  memberSince: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  image: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'past' | 'draft' | 'finalized';
  budget: number;
  participants: number;
  itinerary: ItineraryItem[];
  createdAt: string;
}

export interface ItineraryItem {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  type: 'flight' | 'hotel' | 'restaurant' | 'attraction' | 'transport';
  location: string;
  price?: number;
  booked: boolean;
}

export interface CartItem {
  id: string;
  tripId: string;
  itineraryItemId: string;
  title: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ExternalOption {
  id: string;
  type: 'flight' | 'hotel' | 'restaurant' | 'attraction';
  title: string;
  description: string;
  image: string;
  price: number;
  rating: number;
  location: string;
  features: string[];
}

export interface ComprehensiveItinerary {
  summary: {
    destination: string;
    duration: number;
    totalEstimatedCost: string;
    highlights: string[];
    bestTimeToVisit: string;
    localCurrency: string;
    localInsights: string[];
  };
  dailyPlans: DailyPlan[];
  recommendations: {
    packing: string[];
    tips: string[];
    alternatives: string[];
    localCustoms: string[];
    safetyTips: string[];
    hiddenGems: string[];
    localFoods: string[];
    photographySpots: string[];
  };
  practicalInfo: {
    bestTransportation: string;
    localLanguage: string;
    tippingCulture: string;
    emergencyContacts: string;
    localApps: string[];
  };
  externalServices: {
    transportNote: string;
    accommodationNote: string;
    restaurantNote: string;
  };
}

export interface DailyPlan {
  day: number;
  date: string;
  morning: ActivityDetail;
  afternoon: ActivityDetail;
  evening: ActivityDetail;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  transportation: string;
  totalDayCost: string;
  dayHighlights: string[];
  weatherContingency: string;
}

export interface ActivityDetail {
  activity: string;
  activityType: string;
  location: string;
  duration: string;
  cost: string;
  notes: string;
  bestTime: string;
  localTip: string;
}