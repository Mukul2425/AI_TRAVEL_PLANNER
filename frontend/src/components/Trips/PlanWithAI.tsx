import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, Calendar, Users, DollarSign, MapPin, Clock, Star } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useTrips } from '../../hooks/useTrips';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';


interface PlanWithAIProps {
  tripId: string;
  onNavigate: (view: string, tripId?: string) => void;
}


interface AIPreferences {
  interests: string[];
  budget: string;
  groupSize: number;
  timeLimits: string;
  weather: string;
  accessibility: string;
}


const interestOptions = [
  { id: 'culture', label: 'Culture & History', icon: '🏛️' },
  { id: 'food', label: 'Food & Dining', icon: '🍽️' },
  { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
  { id: 'adventure', label: 'Adventure & Sports', icon: '🏔️' },
  { id: 'relaxation', label: 'Relaxation & Wellness', icon: '🧘' },
  { id: 'nightlife', label: 'Nightlife & Entertainment', icon: '🎭' },
  { id: 'shopping', label: 'Shopping & Markets', icon: '🛍️' },
  { id: 'photography', label: 'Photography', icon: '📸' },
];


const budgetOptions = [
  { id: 'budget', label: 'Budget', description: 'Affordable options' },
  { id: 'moderate', label: 'Moderate', description: 'Comfortable mid-range' },
  { id: 'luxury', label: 'Luxury', description: 'Premium experiences' },
  { id: 'ultra-luxury', label: 'Ultra Luxury', description: 'Exclusive & opulent' },
];


const timeLimitOptions = [
  { id: 'flexible', label: 'Very Flexible', description: 'No time constraints' },
  { id: 'moderate', label: 'Somewhat Flexible', description: 'Some time limits' },
  { id: 'tight', label: 'Tight Schedule', description: 'Optimized for time' },
  { id: 'packed', label: 'Packed Itinerary', description: 'Maximum activities' },
];


const weatherOptions = [
  { id: 'summer', label: 'Summer', icon: '☀️' },
  { id: 'winter', label: 'Winter', icon: '❄️' },
  { id: 'spring', label: 'Spring', icon: '🌸' },
  { id: 'fall', label: 'Fall', icon: '🍂' },
  { id: 'any', label: 'Any Season', icon: '🌤️' },
];


const accessibilityOptions = [
  { id: 'standard', label: 'Standard', description: 'Regular accessibility' },
  { id: 'wheelchair', label: 'Wheelchair Accessible', description: 'Full accessibility' },
  { id: 'mobility', label: 'Limited Mobility', description: 'Reduced walking' },
  { id: 'senior', label: 'Senior Friendly', description: 'Gentle pace' },
];


export const PlanWithAI: React.FC<PlanWithAIProps> = ({ tripId, onNavigate }) => {
  const { getTripById } = useTrips();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [preferences, setPreferences] = useState<AIPreferences>({
    interests: ['culture', 'food'],
    budget: 'moderate',
    groupSize: 1,
    timeLimits: 'flexible',
    weather: 'any',
    accessibility: 'standard',
  });


  useEffect(() => {
    // Avoid duplicate load in StrictMode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadTrip = async () => {
      try {
        setLoading(true);
        // First, try from hook cache
        const cached = getTripById(tripId);
        if (cached) {
          setTrip(cached);
          setPreferences(prev => ({
            ...prev,
            groupSize: Number(cached.participants) > 0 ? Number(cached.participants) : 1,
          }));
          return;
        }
        // Fallback: fetch directly by id
        const raw = await apiFetch<any>(routes.trips.byId(tripId));
        const data = raw?.data || raw;
        const tripObj = data?.data || data;
        if (tripObj) {
          setTrip(tripObj);
          setPreferences(prev => ({
            ...prev,
            groupSize: Number(tripObj.participants) > 0 ? Number(tripObj.participants) : 1,
          }));
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    loadTrip();
  }, [tripId]);


  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };


  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setMessage(null);


    try {
      // Store preferences for the itinerary manager
      localStorage.setItem(`ai-preferences:${tripId}`, JSON.stringify(preferences));
      
      // Generate AI itinerary
      const genRes = await apiFetch<any>(routes.itineraries.generate(), {
        method: 'POST',
        body: {
          tripId,
          preferences,
          trip: trip,
        },
      });
      // Optional success message
      setMessage('AI generation requested. Preparing your itinerary...');

      // Poll for itinerary availability, then navigate to view
      let attempts = 0;
      let found = false;
      while (attempts < 8) {
        try {
          const raw = await apiFetch<any>(routes.trips.itineraryByTrip(tripId));
          const data = raw?.data || raw;
          const res = data?.itinerary || data?.plan || data;
          const hasDailyPlans = Array.isArray(res?.dailyPlans) && res.dailyPlans.length > 0;
          const isArray = Array.isArray(res) && res.length > 0;
          if (hasDailyPlans || isArray) {
            found = true;
            break;
          }
        } catch (pollErr) {
          // ignore and retry
        }
        await new Promise(r => setTimeout(r, 800));
        attempts += 1;
      }

      if (found) {
        onNavigate('view-itinerary', tripId);
      } else {
        // Fallback: navigate to itinerary manager so user can see status
        onNavigate('itinerary', tripId);
      }

    } catch (error) {
      const msg = (error as any)?.message || 'Failed to generate itinerary';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-luxury-600">Loading trip details...</p>
          </div>
        </div>
      </div>
    );
  }


  if (!trip) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <GlassCard className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-serif font-semibold text-luxury-900 mb-4">Trip Not Found</h2>
            <p className="text-luxury-600 mb-6">The requested trip could not be found.</p>
            <Button onClick={() => onNavigate('trips')} variant="primary">Back to Trips</Button>
          </GlassCard>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-amber-300/20 rounded-full animate-float blur-sm"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/25 to-blue-300/15 rounded-full animate-float-delayed blur-sm"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-gradient-to-br from-emerald-200/20 to-emerald-300/10 rounded-full animate-pulse-slow blur-sm"></div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>


      <div className="relative z-10 pt-24 px-4 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <Button onClick={() => onNavigate('trip-details', tripId)} variant="ghost" className="text-luxury-700 hover:text-luxury-900 mb-6">
              ← Back to Trip Details
            </Button>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-gradient rounded-full mb-4 animate-glow">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-serif font-bold text-luxury-900 mb-4">Plan with AI</h1>
              <p className="text-xl text-luxury-600 max-w-2xl mx-auto">
                Let our AI create a personalized itinerary for your trip to <span className="font-semibold text-gold-600">{trip?.destination || 'your destination'}</span>
              </p>
            </div>
          </div>


          {/* Trip Summary */}
          <GlassCard className="p-6 mb-8 animate-fade-in">
            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                {message}
              </div>
            )}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <img
                src={trip?.image || 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={trip?.title || 'Trip'}
                className="w-24 h-24 rounded-xl object-cover shadow-lg"
              />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-serif font-bold text-luxury-900 mb-2">{trip?.title || 'Your Trip'}</h2>
                <p className="text-luxury-600 mb-4">{trip?.destination || 'Destination not set'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-luxury-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{trip?.startDate || 'Start'} - {trip?.endDate || 'End'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{Number(trip?.participants) > 0 ? Number(trip.participants) : 1} {Number(trip?.participants) === 1 ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{Number.isFinite(Number(trip?.budget)) && Number(trip?.budget) > 0 ? `₹${Number(trip.budget).toLocaleString()} budget` : 'Budget not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>


          {/* AI Preferences Form */}
          <form onSubmit={handleGenerateAI} className="space-y-8">
            {/* Interests */}
            <GlassCard className="p-6 animate-fade-in">
              <h3 className="text-xl font-serif font-semibold text-luxury-900 mb-4 flex items-center space-x-2">
                <Star className="w-5 h-5 text-gold-600" />
                <span>What interests you most?</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleInterest(option.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      preferences.interests.includes(option.id)
                        ? 'border-gold-400 bg-gold-50 text-gold-800'
                        : 'border-luxury-200 bg-white/80 text-luxury-700 hover:border-gold-300 hover:bg-gold-25'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </GlassCard>


            {/* Budget & Group Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6 animate-fade-in">
                <h3 className="text-lg font-serif font-semibold text-luxury-900 mb-4 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gold-600" />
                  <span>Budget Level</span>
                </h3>
                <div className="space-y-3">
                  {budgetOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="budget"
                        value={option.id}
                        checked={preferences.budget === option.id}
                        onChange={(e) => setPreferences(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-4 h-4 text-gold-600 border-luxury-300 focus:ring-gold-500"
                      />
                      <div>
                        <div className="font-medium text-luxury-900">{option.label}</div>
                        <div className="text-sm text-luxury-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </GlassCard>


              <GlassCard className="p-6 animate-fade-in">
                <h3 className="text-lg font-serif font-semibold text-luxury-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gold-600" />
                  <span>Group Size</span>
                </h3>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, groupSize: Math.max(1, prev.groupSize - 1) }))}
                    className="w-10 h-10 rounded-full bg-luxury-200 hover:bg-luxury-300 flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-luxury-900 min-w-[3rem] text-center">
                    {preferences.groupSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, groupSize: prev.groupSize + 1 }))}
                    className="w-10 h-10 rounded-full bg-luxury-200 hover:bg-luxury-300 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </GlassCard>
            </div>


            {/* Time Limits & Weather */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6 animate-fade-in">
                <h3 className="text-lg font-serif font-semibold text-luxury-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gold-600" />
                  <span>Time Flexibility</span>
                </h3>
                <div className="space-y-3">
                  {timeLimitOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="timeLimits"
                        value={option.id}
                        checked={preferences.timeLimits === option.id}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timeLimits: e.target.value }))}
                        className="w-4 h-4 text-gold-600 border-luxury-300 focus:ring-gold-500"
                      />
                      <div>
                        <div className="font-medium text-luxury-900">{option.label}</div>
                        <div className="text-sm text-luxury-600">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </GlassCard>


              <GlassCard className="p-6 animate-fade-in">
                <h3 className="text-lg font-serif font-semibold text-luxury-900 mb-4 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gold-600" />
                  <span>Preferred Season</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {weatherOptions.map((option) => (
                    <label key={option.id} className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-luxury-200 hover:border-gold-300 transition-colors">
                      <input
                        type="radio"
                        name="weather"
                        value={option.id}
                        checked={preferences.weather === option.id}
                        onChange={(e) => setPreferences(prev => ({ ...prev, weather: e.target.value }))}
                        className="w-4 h-4 text-gold-600 border-luxury-300 focus:ring-gold-500"
                      />
                      <span className="text-lg">{option.icon}</span>
                      <span className="text-sm font-medium text-luxury-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </GlassCard>
            </div>


            {/* Accessibility */}
            <GlassCard className="p-6 animate-fade-in">
              <h3 className="text-lg font-serif font-semibold text-luxury-900 mb-4 flex items-center space-x-2">
                <Users className="w-5 h-5 text-gold-600" />
                <span>Accessibility Needs</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accessibilityOptions.map((option) => (
                  <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-luxury-200 hover:border-gold-300 transition-colors">
                    <input
                      type="radio"
                      name="accessibility"
                      value={option.id}
                      checked={preferences.accessibility === option.id}
                      onChange={(e) => setPreferences(prev => ({ ...prev, accessibility: e.target.value }))}
                      className="w-4 h-4 text-gold-600 border-luxury-300 focus:ring-gold-500"
                    />
                    <div>
                      <div className="font-medium text-luxury-900">{option.label}</div>
                      <div className="text-sm text-luxury-600">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </GlassCard>


            {/* Generate Button */}
            <div className="text-center animate-fade-in">
              <Button
                type="submit"
                disabled={generating}
                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Generating AI Itinerary...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Wand2 className="w-5 h-5" />
                    <span>Generate AI Itinerary</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
