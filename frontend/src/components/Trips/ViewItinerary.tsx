import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, Circle, ArrowLeft, Star, Coffee, Utensils, Moon, Camera, Info, Lightbulb, Shield, Heart, Plus, Map } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';
import { ComprehensiveItinerary, DailyPlan, ActivityDetail, ItineraryItem } from '../../types';
import { ItineraryMap } from '../Maps/ItineraryMap';
import { TripOverviewMap } from '../Maps/TripOverviewMap';
import { useItineraryMap } from '../../hooks/useMaps';

interface ViewItineraryProps {
  tripId: string;
  onNavigate: (view: string, tripId?: string) => void;
}

// Helper function to convert ItineraryItem[] to DailyPlan[] format
const convertItineraryItemsToDailyPlans = (items: ItineraryItem[]): DailyPlan[] => {
  const dailyPlans: DailyPlan[] = [];
  const groupedByDay = items.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  Object.entries(groupedByDay).forEach(([dayStr, dayItems]) => {
    const day = parseInt(dayStr);
    const sortedItems = dayItems.sort((a, b) => a.time.localeCompare(b.time));
    
    // Create default activity details
    const createActivityDetail = (item: ItineraryItem): ActivityDetail => ({
      activity: item.title,
      activityType: item.type,
      location: item.location,
      duration: '2 hours', // Default duration
      cost: item.price ? `₹${item.price}` : 'Free',
      notes: item.description,
      bestTime: item.time,
      localTip: `Book in advance for ${item.title}`
    });

    // Group items by time of day
    const morningItems = sortedItems.filter(item => 
      item.time.includes('morning') || item.time.includes('AM') || 
      (parseInt(item.time.split(':')[0]) >= 6 && parseInt(item.time.split(':')[0]) < 12)
    );
    const afternoonItems = sortedItems.filter(item => 
      item.time.includes('afternoon') || 
      (parseInt(item.time.split(':')[0]) >= 12 && parseInt(item.time.split(':')[0]) < 18)
    );
    const eveningItems = sortedItems.filter(item => 
      item.time.includes('evening') || item.time.includes('PM') || 
      (parseInt(item.time.split(':')[0]) >= 18 || parseInt(item.time.split(':')[0]) < 6)
    );

    // Create daily plan
    const dailyPlan: DailyPlan = {
      day,
      date: new Date().toISOString().split('T')[0], // Default date
      morning: morningItems.length > 0 ? createActivityDetail(morningItems[0]) : {
        activity: 'Free time',
        activityType: 'relaxation',
        location: 'Hotel area',
        duration: '2 hours',
        cost: 'Free',
        notes: 'Enjoy some free time or explore the local area',
        bestTime: '9:00 AM',
        localTip: 'Check out local cafes nearby'
      },
      afternoon: afternoonItems.length > 0 ? createActivityDetail(afternoonItems[0]) : {
        activity: 'Sightseeing',
        activityType: 'sightseeing',
        location: 'City center',
        duration: '3 hours',
        cost: 'Varies',
        notes: 'Explore the main attractions',
        bestTime: '2:00 PM',
        localTip: 'Bring comfortable walking shoes'
      },
      evening: eveningItems.length > 0 ? createActivityDetail(eveningItems[0]) : {
        activity: 'Dinner',
        activityType: 'restaurant',
        location: 'Local restaurant',
        duration: '2 hours',
        cost: '$$',
        notes: 'Enjoy local cuisine',
        bestTime: '7:00 PM',
        localTip: 'Make reservations in advance'
      },
      meals: {
        breakfast: 'Hotel breakfast',
        lunch: 'Local restaurant',
        dinner: 'Fine dining'
      },
      transportation: 'Walking and public transport',
      totalDayCost: dayItems.reduce((sum, item) => sum + (item.price || 0), 0).toString(),
      dayHighlights: dayItems.map(item => item.title),
      weatherContingency: 'Indoor alternatives available'
    };

    dailyPlans.push(dailyPlan);
  });

  return dailyPlans.sort((a, b) => a.day - b.day);
};

// Normalize a backend "plan" object into DailyPlan[]
const normalizePlanToDailyPlans = (plan: any): DailyPlan[] => {
  try {
    // Case 1: plan already has dailyPlans
    if (Array.isArray(plan?.dailyPlans)) {
      return plan.dailyPlans as DailyPlan[];
    }

    // Case 2: plan.days array with day objects
    const days = plan?.days || plan?.plan || [];
    if (Array.isArray(days) && days.length > 0) {
      return days.map((d: any, idx: number) => {
        const num = Number(d?.day ?? idx + 1);
        const toActivity = (src: any, fallback: Partial<ActivityDetail> = {}): ActivityDetail => ({
          activity: src?.activity || src?.title || fallback.activity || 'Activity',
          activityType: src?.activityType || src?.type || fallback.activityType || 'attraction',
          location: src?.location || fallback.location || 'TBD',
          duration: src?.duration || fallback.duration || '2 hours',
          cost: src?.cost || (typeof src?.price === 'number' ? `₹${src.price}` : fallback.cost || 'Varies'),
          notes: src?.notes || src?.description || fallback.notes || '',
          bestTime: src?.bestTime || src?.time || fallback.bestTime || 'Anytime',
          localTip: src?.localTip || fallback.localTip || ''
        });
        return {
          day: num,
          date: d?.date || new Date().toISOString().split('T')[0],
          morning: toActivity(d?.morning || d?.am || d?.MORNING, { activity: 'Explore', activityType: 'sightseeing' }),
          afternoon: toActivity(d?.afternoon || d?.pm || d?.AFTERNOON, { activity: 'Visit attraction', activityType: 'attraction' }),
          evening: toActivity(d?.evening || d?.EVENING || d?.night, { activity: 'Dinner', activityType: 'restaurant' }),
          meals: {
            breakfast: d?.meals?.breakfast || 'Hotel breakfast',
            lunch: d?.meals?.lunch || 'Local restaurant',
            dinner: d?.meals?.dinner || 'Dinner in town'
          },
          transportation: d?.transportation || d?.transport || 'Public transport / walk',
          totalDayCost: String(d?.totalDayCost || d?.totalCost || d?.cost || 0),
          dayHighlights: Array.isArray(d?.dayHighlights) ? d.dayHighlights : (Array.isArray(d?.highlights) ? d.highlights : []).filter(Boolean),
          weatherContingency: d?.weatherContingency || d?.weatherPlan || 'Indoor alternatives available'
        } as DailyPlan;
      }) as DailyPlan[];
    }

    // Case 3: plan.plan.dailyPlans (nested)
    if (Array.isArray(plan?.plan?.dailyPlans)) {
      return plan.plan.dailyPlans as DailyPlan[];
    }
  } catch {}
  return [];
};

// Ensure required fields exist in DailyPlan[] and ActivityDetail with safe defaults
const sanitizeDailyPlans = (plans: any[]): DailyPlan[] => {
  const toActivity = (src: any): ActivityDetail => ({
    activity: src?.activity || src?.title || 'Activity',
    activityType: src?.activityType || src?.type || 'sightseeing',
    location: src?.location || 'TBD',
    duration: src?.duration || '2 hours',
    cost: src?.cost || (typeof src?.price === 'number' ? `₹${src.price}` : 'Varies'),
    notes: src?.notes || src?.description || '',
    bestTime: src?.bestTime || src?.time || 'Anytime',
    localTip: src?.localTip || ''
  });
  return (plans || []).map((d: any, index: number) => ({
    day: Number(d?.day ?? index + 1),
    date: d?.date || new Date().toISOString().split('T')[0],
    morning: toActivity(d?.morning || {}),
    afternoon: toActivity(d?.afternoon || {}),
    evening: toActivity(d?.evening || {}),
    meals: {
      breakfast: d?.meals?.breakfast || 'Hotel breakfast',
      lunch: d?.meals?.lunch || 'Local restaurant',
      dinner: d?.meals?.dinner || 'Dinner in town',
    },
    transportation: d?.transportation || d?.transport || 'Public transport / walk',
    totalDayCost: String(d?.totalDayCost || d?.totalCost || d?.cost || ''),
    dayHighlights: Array.isArray(d?.dayHighlights) ? d.dayHighlights : (Array.isArray(d?.highlights) ? d.highlights : []),
    weatherContingency: d?.weatherContingency || d?.weatherPlan || '',
  }));
};

const activityTypeIcons: Record<string, string> = {
  attraction: '🎯',
  restaurant: '🍽️',
  cultural: '🏛️',
  nature: '🌿',
  adventure: '⛰️',
  shopping: '🛍️',
  entertainment: '🎭',
  relaxation: '🧘',
  transport: '🚗',
  sightseeing: '👁️',
  museum: '🏛️',
  park: '🌳',
  beach: '🏖️',
  nightlife: '🌙',
  food: '🍴',
  default: '📍'
};

const activityTypeColors: Record<string, string> = {
  attraction: 'bg-gradient-to-br from-emerald-100 to-green-150 text-emerald-800 border-emerald-200/60',
  restaurant: 'bg-gradient-to-br from-orange-100 to-amber-150 text-orange-800 border-orange-200/60',
  cultural: 'bg-gradient-to-br from-purple-100 to-violet-150 text-purple-800 border-purple-200/60',
  nature: 'bg-gradient-to-br from-green-100 to-emerald-150 text-green-800 border-green-200/60',
  adventure: 'bg-gradient-to-br from-red-100 to-rose-150 text-red-800 border-red-200/60',
  shopping: 'bg-gradient-to-br from-pink-100 to-rose-150 text-pink-800 border-pink-200/60',
  entertainment: 'bg-gradient-to-br from-indigo-100 to-blue-150 text-indigo-800 border-indigo-200/60',
  relaxation: 'bg-gradient-to-br from-teal-100 to-cyan-150 text-teal-800 border-teal-200/60',
  transport: 'bg-gradient-to-br from-slate-100 to-gray-150 text-slate-800 border-slate-200/60',
  sightseeing: 'bg-gradient-to-br from-sky-100 to-blue-150 text-sky-800 border-sky-200/60',
  museum: 'bg-gradient-to-br from-amber-100 to-yellow-150 text-amber-800 border-amber-200/60',
  park: 'bg-gradient-to-br from-lime-100 to-green-150 text-lime-800 border-lime-200/60',
  beach: 'bg-gradient-to-br from-cyan-100 to-blue-150 text-cyan-800 border-cyan-200/60',
  nightlife: 'bg-gradient-to-br from-violet-100 to-purple-150 text-violet-800 border-violet-200/60',
  food: 'bg-gradient-to-br from-orange-100 to-red-150 text-orange-800 border-orange-200/60',
  default: 'bg-gradient-to-br from-gray-100 to-slate-150 text-gray-800 border-gray-200/60'
};

const timeOfDayIcons = {
  morning: <Coffee className="w-5 h-5" />,
  afternoon: <Star className="w-5 h-5" />,
  evening: <Moon className="w-5 h-5" />
};

export const ViewItinerary: React.FC<ViewItineraryProps> = ({ tripId, onNavigate }) => {
  const [trip, setTrip] = useState<any>(null);
  const [itinerary, setItinerary] = useState<DailyPlan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [bookedActivities, setBookedActivities] = useState<Set<string>>(new Set());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapView, setMapView] = useState<'overview' | 'detailed'>('overview');

  // Use the maps hook
  const { mapData, selectedDay, loading: mapLoading, error: mapError, loadItineraryMap, loadDayMap, setSelectedDay } = useItineraryMap(tripId, itinerary);

  const loadTripData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const tripsData = localStorage.getItem('trips');
      let tripData = null;

      if (tripsData) {
        try {
          const trips = JSON.parse(tripsData);
          tripData = trips.find((t: any) => t.id === tripId);
        } catch (parseErr) {
        }
      }

      if (tripData) {
        setTrip(tripData);

        if (tripData.itinerary) {
          if (Array.isArray(tripData.itinerary)) {
            // Check if it's already DailyPlan[] format
            if (tripData.itinerary.length > 0 && tripData.itinerary[0].morning && tripData.itinerary[0].afternoon && tripData.itinerary[0].evening) {
              setItinerary(sanitizeDailyPlans(tripData.itinerary));
            } else {
              // Convert ItineraryItem[] to DailyPlan[] format
              const dailyPlans = convertItineraryItemsToDailyPlans(tripData.itinerary);
              setItinerary(sanitizeDailyPlans(dailyPlans));
            }
          } else if (tripData.itinerary.dailyPlans && Array.isArray(tripData.itinerary.dailyPlans)) {
            setItinerary(sanitizeDailyPlans(tripData.itinerary.dailyPlans));
          }
          // Do not return; continue to API to enrich summary
        }
      }

      const localData = localStorage.getItem(`comprehensive-itinerary:${tripId}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            // Check if it's already DailyPlan[] format
            if (parsed.length > 0 && parsed[0].morning && parsed[0].afternoon && parsed[0].evening) {
              setItinerary(sanitizeDailyPlans(parsed));
            } else {
              // Convert ItineraryItem[] to DailyPlan[] format
              const dailyPlans = convertItineraryItemsToDailyPlans(parsed);
              setItinerary(sanitizeDailyPlans(dailyPlans));
            }
          } else if (parsed.dailyPlans && Array.isArray(parsed.dailyPlans)) {
            setItinerary(sanitizeDailyPlans(parsed.dailyPlans));
            // Merge summary into trip for header display
            if (parsed.summary) {
              setTrip((prev: any) => ({ ...(prev || {}), summary: parsed.summary }));
            }
          }
        } catch (parseErr) {
        }
      }
      try {
        const apiPromise = apiFetch<any>(routes.trips.itineraryByTrip(tripId));
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API timeout')), 5000)
        );

        const response = await Promise.race([apiPromise, timeoutPromise]) as any;

        if (response) {
          // Handle different response structures
          const data = response?.data || response;
          const res = data?.itinerary || data?.plan || data;
          const pickSummary = (d: any) => d?.summary || d?.plan?.summary || null;
          
          if (Array.isArray(res)) {
            // If it's an array, it might be ItineraryItem[] or DailyPlan[]
            // Check if it looks like DailyPlan[] (has morning, afternoon, evening properties)
            if (res.length > 0 && res[0].morning && res[0].afternoon && res[0].evening) {
              setItinerary(sanitizeDailyPlans(res));
              const s = pickSummary(data) || pickSummary(res);
              if (s) setTrip((prev: any) => ({ ...(prev || {}), summary: s }));
              localStorage.setItem(`comprehensive-itinerary:${tripId}`, JSON.stringify(res));
            } else {
              // It's ItineraryItem[], convert to DailyPlan[] format
              const dailyPlans = sanitizeDailyPlans(convertItineraryItemsToDailyPlans(res));
              setItinerary(dailyPlans);
              const s = pickSummary(data) || pickSummary(res);
              if (s) setTrip((prev: any) => ({ ...(prev || {}), summary: s }));
              localStorage.setItem(`comprehensive-itinerary:${tripId}`, JSON.stringify(dailyPlans));
            }
          } else if (res?.dailyPlans && Array.isArray(res.dailyPlans)) {
            setItinerary(sanitizeDailyPlans(res.dailyPlans));
            const s = pickSummary(res) || pickSummary(data);
            if (s) setTrip((prev: any) => ({ ...(prev || {}), summary: s }));
            localStorage.setItem(`comprehensive-itinerary:${tripId}`, JSON.stringify(res.dailyPlans));
          } else if (data?.dailyPlans && Array.isArray(data.dailyPlans)) {
            setItinerary(sanitizeDailyPlans(data.dailyPlans));
            const s = pickSummary(data);
            if (s) setTrip((prev: any) => ({ ...(prev || {}), summary: s }));
            localStorage.setItem(`comprehensive-itinerary:${tripId}`, JSON.stringify(data.dailyPlans));
          } else if (res?.plan || data?.plan) {
            const planObj = res?.plan || data?.plan;
            // Prefer explicit dailyPlans if present
            const fromDaily = Array.isArray(planObj?.dailyPlans) ? planObj.dailyPlans : null;
            const dailyPlans = fromDaily ? sanitizeDailyPlans(fromDaily) : sanitizeDailyPlans(normalizePlanToDailyPlans(planObj));
            if (dailyPlans.length > 0) {
              setItinerary(dailyPlans);
              const s = pickSummary({ plan: planObj }) || planObj?.summary;
              if (s) setTrip((prev: any) => ({ ...(prev || {}), summary: s }));
              localStorage.setItem(`comprehensive-itinerary:${tripId}`, JSON.stringify(dailyPlans));
            } else {
              setItinerary(null);
            }
          } else {
            setItinerary(null);
          }
        } else {
          setItinerary(null);
        }
      } catch (apiErr: any) {
        
        // Fallback: Check for regular itinerary data in localStorage
        const fallbackData = localStorage.getItem(`itinerary:${tripId}`);
        if (fallbackData) {
          try {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed)) {
              const dailyPlans = convertItineraryItemsToDailyPlans(parsed);
              setItinerary(dailyPlans);
              return;
            }
          } catch (parseErr) {
          }
        }
        
        setItinerary(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load itinerary');
      setItinerary(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  useEffect(() => {
    const savedBookings = localStorage.getItem(`booked-activities:${tripId}`);
    if (savedBookings) {
      try {
        const bookings: string[] = JSON.parse(savedBookings);
        setBookedActivities(new Set(bookings));
      } catch (err) {
      }
    }
  }, [tripId]);

  useEffect(() => {
    if (itinerary?.length) {
      const timer = setTimeout(() => {
        const items = itinerary.flatMap(day => [
          `${day.day}-morning`,
          `${day.day}-afternoon`,
          `${day.day}-evening`
        ]);
        items.forEach((id, index) => {
          setTimeout(() => {
            setVisibleItems(prev => new Set([...prev, id]));
          }, index * 100);
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [itinerary]);

  const toggleActivityBooked = useCallback((activityId: string) => {
    setBookedActivities(prev => {
      const newBookedActivities = new Set(prev);
      if (newBookedActivities.has(activityId)) {
        newBookedActivities.delete(activityId);
      } else {
        newBookedActivities.add(activityId);
      }
      localStorage.setItem(`booked-activities:${tripId}`, JSON.stringify([...newBookedActivities]));
      return newBookedActivities;
    });
  }, [tripId]);

  const calculateDayProgress = useCallback((day: DailyPlan) => {
    const activities = [
      `${day.day}-morning`,
      `${day.day}-afternoon`,
      `${day.day}-evening`
    ];
    const bookedCount = activities.filter(id => bookedActivities.has(id)).length;
    return (bookedCount / activities.length) * 100;
  }, [bookedActivities]);

  const getTotalProgress = useCallback(() => {
    if (!itinerary?.length) return 0;
    const totalActivities = itinerary.length * 3;
    const totalBooked = [...bookedActivities].length;
    return (totalBooked / totalActivities) * 100;
  }, [itinerary, bookedActivities]);

  const renderActivity = useCallback((activity: ActivityDetail, timeOfDay: 'morning' | 'afternoon' | 'evening', day: number) => {
    const activityId = `${day}-${timeOfDay}`;
    const isBooked = bookedActivities.has(activityId);
    const isVisible = visibleItems.has(activityId);

    const activityTypeRaw = String(activity?.activityType || 'default').toLowerCase();
    const activityType = activityTypeRaw in activityTypeIcons ? activityTypeRaw : 'default';

    return (
      <div
        key={activityId}
        className={`transform transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl ${
          isBooked
            ? 'border-gold-300/60 bg-gradient-to-br from-gold-50/80 to-amber-50/60 shadow-lg'
            : 'border-white/60 bg-gradient-to-br from-white/80 to-white/60 hover:border-gold-200/60 shadow-lg hover:shadow-xl'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/0 via-gold-400/0 to-gold-500/0 group-hover:via-gold-400/5 transition-all duration-500"></div>

          <div className="relative p-6">
            <div className="flex items-start space-x-5">
              <div className="flex-shrink-0">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-luxury-100 to-luxury-200 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110">
                  {timeOfDayIcons[timeOfDay]}
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-xs shadow-lg">
                    {activityTypeIcons[activityType]}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-xl font-semibold text-luxury-900 group-hover:text-luxury-800 transition-colors">
                        {activity.activity}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-sm ${
                        activityTypeColors[activityType]
                      }`}>
                        {timeOfDay}
                      </span>
                    </div>

                    <p className="text-luxury-600 mb-4 leading-relaxed">{activity.notes}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <div className="flex items-center space-x-2 bg-white/50 rounded-full px-3 py-1.5 backdrop-blur-sm shadow-sm">
                        <Clock className="w-4 h-4 text-luxury-500" />
                        <span className="font-medium text-luxury-700">{activity.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 rounded-full px-3 py-1.5 backdrop-blur-sm shadow-sm">
                        <MapPin className="w-4 h-4 text-luxury-500" />
                        <span className="font-medium text-luxury-700">{activity.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/50 rounded-full px-3 py-1.5 backdrop-blur-sm shadow-sm">
                        <DollarSign className="w-4 h-4 text-luxury-500" />
                        <span className="font-medium text-luxury-700">{activity.cost}</span>
                      </div>
                    </div>

                    {activity.localTip && (
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/60 rounded-xl p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-amber-800 font-medium">{activity.localTip}</p>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-luxury-500 font-medium">
                      Best time: {activity.bestTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => toggleActivityBooked(activityId)}
                  className={`relative p-3 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                    isBooked
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-emerald-500/25'
                      : 'bg-white/60 text-luxury-400 hover:text-gold-600 hover:bg-gold-50 shadow-md backdrop-blur-sm border border-white/40'
                  }`}
                  title={isBooked ? 'Mark as not booked' : 'Mark as booked'}
                >
                  {isBooked ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {isBooked && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                BOOKED
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [bookedActivities, visibleItems, toggleActivityBooked]);

  const summary = trip?.summary || {
    destination: 'Unknown Destination',
    duration: itinerary?.length || 0,
    totalEstimatedCost: 'N/A',
    highlights: [] as string[],
    bestTimeToVisit: '',
    localCurrency: '',
    localInsights: []
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gold-200 rounded-full animate-spin mx-auto mb-6">
                <div className="absolute top-1 left-1 w-4 h-4 bg-gold-500 rounded-full animate-pulse"></div>
              </div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-gold-400/30 border-t-gold-600 rounded-full animate-spin mx-auto"></div>
            </div>
            <h3 className="text-2xl font-serif font-semibold text-luxury-900 mb-2">
              Loading Your Itinerary
            </h3>
            <p className="text-luxury-600 mb-6 max-w-md mx-auto">
              Preparing your travel schedule with all the exciting details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <GlassCard className="p-8 text-center max-w-md animate-fade-in">
            <h2 className="text-2xl font-serif font-semibold text-luxury-900 mb-4">Error Loading Itinerary</h2>
            <p className="text-luxury-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => onNavigate('trip-details', tripId)} variant="primary">
                Back to Trip Details
              </Button>
              <Button onClick={loadTripData} variant="ghost">
                Try Again
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <GlassCard className="p-8 text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-luxury-900 mb-4">No Itinerary Found</h2>
            <p className="text-luxury-600 mb-6">
              This trip doesn't have a detailed itinerary yet. You can create one or return to trip details.
            </p>
            <div className="space-y-3">
              <Button onClick={() => onNavigate('trip-details', tripId)} variant="primary">
                Back to Trip Details
              </Button>
              <Button onClick={loadTripData} variant="ghost">
                Refresh
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const totalProgress = getTotalProgress();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-20"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/20 to-gold-300/15 rounded-full animate-float blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-200/15 to-sky-300/10 rounded-full animate-float-delayed blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-100/10 via-pink-100/10 to-orange-100/10 rounded-full animate-pulse blur-3xl"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      <div className="relative z-10 pt-16 px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 animate-fade-in">
            <Button 
              onClick={() => onNavigate('trip-details', tripId)} 
              variant="ghost" 
              className="text-luxury-700 hover:text-luxury-900 mb-8 group transition-all duration-300 hover:bg-white/60 backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Trip Details
            </Button>

            <div className="text-center mb-12">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl animate-glow">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-serif font-bold text-luxury-900 mb-6 tracking-tight">
                Your Journey
              </h1>
              <div className="space-y-2">
                <p className="text-2xl text-luxury-700 font-medium">{summary.destination}</p>
                <p className="text-xl text-luxury-500">{summary.duration} days of adventure</p>
              </div>
            </div>
          </div>

          <GlassCard className="p-8 mb-12 animate-fade-in border border-white/40 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="relative group">
                <img
                  src={trip?.image || 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={trip?.title || summary.destination}
                  className="w-32 h-32 rounded-2xl object-cover shadow-xl transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="flex-1 text-center lg:text-left space-y-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-luxury-900 mb-2">{trip?.title || summary.destination}</h2>
                  <p className="text-luxury-600 text-lg">{summary.destination}</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-luxury-600">
                  <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2 backdrop-blur-sm">
                    <Calendar className="w-5 h-5 text-luxury-500" />
                    <span className="font-medium">{summary.duration} days</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2 backdrop-blur-sm">
                    <DollarSign className="w-5 h-5 text-luxury-500" />
                    <span className="font-medium">{summary.totalEstimatedCost}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2 backdrop-blur-sm">
                    <Star className="w-5 h-5 text-luxury-500" />
                    <span className="font-medium">{summary.localCurrency}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-luxury-600 font-medium">Trip Progress</span>
                    <span className="text-luxury-700 font-semibold">{Math.round(totalProgress)}% complete</span>
                  </div>
                  <div className="w-full bg-luxury-200/50 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-amber-500 rounded-full transition-all duration-1000 ease-out shadow-inner"
                      style={{ width: `${totalProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="bg-gradient-to-r from-luxury-600 to-luxury-700 hover:from-luxury-700 hover:to-luxury-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Travel Tips
                </Button>
                <Button
                  onClick={() => setShowMap(!showMap)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Map className="w-4 h-4 mr-2" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>
            </div>
          </GlassCard>

          {showRecommendations && (
            <GlassCard className="p-8 mb-12 animate-fade-in border border-white/40 shadow-2xl">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-gold-600" />
                    <h3 className="text-lg font-semibold text-luxury-900">Local Tips</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-luxury-700">
                    {trip?.recommendations?.tips?.slice(0, 3).map((tip: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-gold-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Heart className="w-5 h-5 text-rose-600" />
                    <h3 className="text-lg font-semibold text-luxury-900">Hidden Gems</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-luxury-700">
                    {trip?.recommendations?.hiddenGems?.slice(0, 3).map((gem: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{gem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-luxury-900">Safety Tips</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-luxury-700">
                    {trip?.recommendations?.safetyTips?.slice(0, 3).map((tip: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </GlassCard>
          )}

          {showMap && (
            <GlassCard className="p-8 mb-12 animate-fade-in border border-white/40 shadow-2xl">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-serif font-bold text-luxury-900 flex items-center">
                    <Map className="w-6 h-6 mr-3 text-blue-600" />
                    Trip Map
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setMapView('overview')}
                      variant={mapView === 'overview' ? 'primary' : 'ghost'}
                      className="text-sm"
                    >
                      Overview
                    </Button>
                    <Button
                      onClick={() => setMapView('detailed')}
                      variant={mapView === 'detailed' ? 'primary' : 'ghost'}
                      className="text-sm"
                    >
                      Detailed
                    </Button>
                  </div>
                </div>
                
                {mapLoading && (
                  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading map data...</span>
                    </div>
                  </div>
                )}

                {mapError && (
                  <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-center">
                      <div className="text-red-500 text-2xl mb-2">⚠️</div>
                      <p className="text-red-600 font-medium">Failed to load map</p>
                      <p className="text-red-500 text-sm mt-1">{mapError}</p>
                    </div>
                  </div>
                )}

                {mapData && !mapLoading && !mapError && (
                  <div className="space-y-4">
                    {mapView === 'overview' ? (
                      <TripOverviewMap
                        itineraryMapData={mapData}
                        className="w-full h-96"
                        showDayMarkers={true}
                      />
                    ) : (
                      <ItineraryMap
                        itineraryMapData={mapData}
                        selectedDay={selectedDay}
                        onDaySelect={setSelectedDay}
                        className="w-full h-96"
                      />
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 rounded-full shadow-lg"></div>
            
            <div className="space-y-16">
              {itinerary.map((day, dayIndex) => {
                const dayProgress = calculateDayProgress(day);
                const isExpanded = expandedDay === day.day;

                return (
                  <div key={day.day} className="relative animate-fade-in" style={{ animationDelay: `${dayIndex * 0.15}s` }}>
                    <div className="relative flex items-center mb-8">
                      <div className="absolute left-0 w-16 h-16 bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-2xl z-10">
                        <span className="text-white font-bold text-lg">{day.day}</span>
                      </div>
                      
                      <div className="ml-24 flex-1">
                        <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div>
                              <h3 className="text-2xl font-serif font-bold text-luxury-900 mb-1">
                                Day {day.day}
                              </h3>
                              <p className="text-luxury-600 font-medium mb-2">
                                {new Date(day.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(day.dayHighlights || []).map((highlight: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-gold-100 text-gold-800 rounded-full text-xs font-medium">
                                    {highlight}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-luxury-600 mb-2 font-medium">
                                {Math.round(dayProgress)}% planned
                              </div>
                              <div className="w-32 bg-luxury-200/50 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out"
                                  style={{ width: `${dayProgress}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-luxury-500 mt-1">
                                Total: {day.totalDayCost}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-luxury-200/50">
                            <div className="flex items-center space-x-4 text-sm text-luxury-600">
                              <div className="flex items-center space-x-1">
                                <Coffee className="w-4 h-4" />
                                <span>{day.meals.breakfast}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Utensils className="w-4 h-4" />
                                <span>{day.meals.lunch}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Moon className="w-4 h-4" />
                                <span>{day.meals.dinner}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedDay(isExpanded ? null : day.day)}
                            className="mt-4 text-sm text-gold-600 hover:text-gold-700 font-medium transition-colors"
                          >
                            {isExpanded ? 'Show Less' : 'Show Details'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`ml-24 space-y-4 transition-all duration-500 ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      {renderActivity(day.morning, 'morning', day.day)}
                      {renderActivity(day.afternoon, 'afternoon', day.day)}
                      {renderActivity(day.evening, 'evening', day.day)}

                      <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/60 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Transportation
                          </h4>
                          <p className="text-sm text-blue-800">{day.transportation}</p>
                        </div>
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4">
                          <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                            <Camera className="w-4 h-4 mr-2" />
                            Weather Plan
                          </h4>
                          <p className="text-sm text-amber-800">{day.weatherContingency}</p>
                        </div>
                      </div>
                    </div>
                    
                    {dayIndex < itinerary.length - 1 && (
                      <div className="absolute left-8 bottom-0 transform translate-y-8 w-1 h-8 bg-gradient-to-b from-gold-400 to-transparent"></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative mt-12 flex justify-center animate-fade-in" style={{ animationDelay: `${itinerary.length * 0.15 + 0.3}s` }}>
              <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-amber-500 rounded-full shadow-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <GlassCard className="p-8 mt-12 text-center border border-white/40 shadow-2xl animate-fade-in" style={{ animationDelay: `${itinerary.length * 0.15 + 0.5}s` }}>
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-2xl animate-glow">
                <Star className="w-10 h-10 text-white" />
              </div>
              
              <div>
                <h3 className="text-2xl font-serif font-bold text-luxury-900 mb-2">
                  Trip Summary
                </h3>
                <p className="text-luxury-600 max-w-md mx-auto leading-relaxed">
                  You've planned an amazing {summary.duration}-day adventure with {itinerary.length * 3} exciting activities.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                  <div className="text-2xl font-bold text-luxury-900">{summary.duration}</div>
                  <div className="text-sm text-luxury-600 font-medium">Days</div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                  <div className="text-2xl font-bold text-luxury-900">{itinerary.length * 3}</div>
                  <div className="text-sm text-luxury-600 font-medium">Activities</div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                  <div className="text-2xl font-bold text-emerald-600">{bookedActivities.size}</div>
                  <div className="text-sm text-luxury-600 font-medium">Booked</div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm shadow-lg">
                  <div className="text-2xl font-bold text-gold-600">{Math.round(totalProgress)}%</div>
                  <div className="text-sm text-luxury-600 font-medium">Complete</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {summary.highlights.map((highlight: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-gradient-to-r from-gold-100 to-amber-100 text-gold-800 rounded-full text-sm font-medium">
                      {highlight}
                    </span>
                  ))}
                </div>
                
                <Button
                  onClick={() => onNavigate('trip-details', tripId)}
                  className="bg-gradient-to-r from-luxury-600 to-luxury-700 hover:from-luxury-700 hover:to-luxury-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Back to Trip Details
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(1deg);
          }
          66% {
            transform: translateY(5px) rotate(-1deg);
          }
        }
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(8px) rotate(-0.5deg);
          }
          66% {
            transform: translateY(-4px) rotate(0.5deg);
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
