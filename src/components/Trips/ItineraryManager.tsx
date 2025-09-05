import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign, Clock, Plane, Building, Utensils, Camera, Car, Wand2 } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { ItineraryItem } from '../../types';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';

interface ItineraryManagerProps {
  tripId: string;
  onNavigate: (view: string) => void;
}

interface ItineraryFormData {
  day: number;
  time: string;
  title: string;
  description: string;
  type: 'flight' | 'hotel' | 'restaurant' | 'attraction' | 'transport';
  location: string;
  price?: number;
  booked?: boolean;
}

const typeIcons = {
  flight: Plane,
  hotel: Building,
  restaurant: Utensils,
  attraction: Camera,
  transport: Car,
};

const typeColors = {
  flight: 'text-blue-500',
  hotel: 'text-purple-500',
  restaurant: 'text-orange-500',
  attraction: 'text-green-500',
  transport: 'text-gray-500',
};

export const ItineraryManager: React.FC<ItineraryManagerProps> = ({ tripId, onNavigate }) => {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const hasLoadedRef = useRef(false);
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [structuredPlan, setStructuredPlan] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [showAIPreferences, setShowAIPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    interests: ['culture', 'food'] as string[],
    budget: 'moderate',
    groupSize: 1,
    timeLimits: 'flexible',
    weather: 'summer',
    accessibility: 'standard',
  });
  const [tripDefaults, setTripDefaults] = useState<{ budgetNumber: number | null; participants: number | null }>({ budgetNumber: null, participants: null });
  // Preload defaults from Trip details
  useEffect(() => {
    (async () => {
      try {
        const raw = await apiFetch<any>(routes.trips.byId(tripId));
        const data = raw?.data || raw;
        const trip = data?.data || data;
        const participants = Number(
          trip?.participants ??
          trip?.groupSize ??
          trip?.selections?.participants ??
          trip?.preferences?.groupSize ??
          0
        );
        setPreferences(p => ({ ...p, groupSize: participants > 0 ? participants : 1 }));
        const budgetNumber = Number(trip?.budget ?? trip?.selections?.budget ?? trip?.preferences?.budget ?? 0);
        setTripDefaults({ budgetNumber: isFinite(budgetNumber) && budgetNumber > 0 ? budgetNumber : null, participants: participants || null });
        if (budgetNumber > 0) {
          const mapped = budgetNumber < 5000 ? 'low' : budgetNumber < 15000 ? 'moderate' : budgetNumber < 30000 ? 'high' : 'luxury';
          setPreferences(p => ({ ...p, budget: mapped }));
        }
      } catch {}
    })();
  }, [tripId]);
  const [formData, setFormData] = useState<ItineraryFormData>({
    day: 1,
    time: '09:00',
    title: '',
    description: '',
    type: 'attraction',
    location: '',
    price: 0,
  });

  useEffect(() => {
    // Avoid duplicate load in React StrictMode (dev) which mounts effects twice
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    const wantsAI = localStorage.getItem(`ai-plan:${tripId}`) === '1';
    if (wantsAI) {
      try {
        const seedRaw = localStorage.getItem(`ai-seed:${tripId}`);
        if (seedRaw) {
          const seed = JSON.parse(seedRaw);
          const budgetNumber = Number(seed?.budgetNumber || 0);
          if (budgetNumber > 0) {
            const mapped = budgetNumber < 5000 ? 'low' : budgetNumber < 15000 ? 'moderate' : budgetNumber < 30000 ? 'high' : 'luxury';
            setPreferences(p => ({ ...p, budget: mapped }));
          }
          const participants = Number(seed?.participants || 0);
          setPreferences(p => ({ ...p, groupSize: participants > 0 ? participants : 1 }));
        }
      } catch {}
      setShowAIPreferences(true);
      setLoading(false);
      try { localStorage.removeItem(`ai-plan:${tripId}`); } catch {}
    } else {
      loadItinerary();
    }
  }, [tripId]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      // Match backend: GET /api/trips/{tripId}/itinerary returns an itinerary object
      const raw = await apiFetch<any>(routes.trips.itineraryByTrip(tripId));
      const res = raw?.data?.itinerary || raw?.itinerary || raw?.data || raw;
      const items: ItineraryItem[] = Array.isArray(res)
        ? res
        : res?.items || res?.itinerary?.items || [];
      const id: string | undefined = res?.id || res?._id || res?.itineraryId || res?.itinerary?._id;
      if (id) setItineraryId(id);
      const itineraryObj = res?.itinerary || res;
      if (itineraryObj && itineraryObj.plan) setStructuredPlan(itineraryObj);
      setItinerary(items);
      setApiAvailable(true);
    } catch (err: any) {
      const message = String(err?.message || '');
      // Fallback to local storage if API route not found (404)
      if (message.includes('404')) {
        // Use local fallback and prompt AI preferences
        const local = localStorage.getItem(`itinerary:${tripId}`);
        const parsed: ItineraryItem[] = local ? JSON.parse(local) : [];
        setItinerary(parsed);
        setApiAvailable(false);
        setError(null);
        if (parsed.length === 0) {
          setShowAIPreferences(true);
        }
      } else {
        setError(err?.message || 'Failed to load itinerary');
        setItinerary([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists ? prev.interests.filter(i => i !== interest) : [...prev.interests, interest]
      };
    });
  };

  const handleGenerateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Backend: POST /api/itineraries/generate with { tripId, preferences }
      if (apiAvailable) {
        const genRes = await apiFetch<any>(routes.itineraries.generate(), {
          method: 'POST',
          body: { tripId, preferences }
        });
        const newId: string | undefined = genRes?.id || genRes?._id || genRes?.itineraryId;
        if (newId) setItineraryId(newId);
        // The backend may need time to assemble the itinerary. Poll until available.
        let attempts = 0;
        let loadedItems: ItineraryItem[] = [];
        let fetched: any = null;
        while (attempts < 6) {
          try {
            const rawPoll = await apiFetch<any>(routes.trips.itineraryByTrip(tripId));
            fetched = rawPoll?.data?.itinerary || rawPoll?.itinerary || rawPoll?.data || rawPoll;
            loadedItems = Array.isArray(fetched)
              ? fetched
              : fetched?.items || fetched?.itinerary?.items || [];
            const id2: string | undefined = fetched?.id || fetched?._id || fetched?.itineraryId || fetched?.itinerary?._id;
            if (id2) setItineraryId(id2);
            const itineraryObj2 = fetched?.itinerary || fetched;
            if (itineraryObj2 && itineraryObj2.plan) {
              setStructuredPlan(itineraryObj2);
              break;
            }
            if (loadedItems && loadedItems.length > 0) break;
          } catch (pollErr: any) {
            const msg = String(pollErr?.message || '');
            if (!msg.includes('404')) throw pollErr;
          }
          await new Promise(r => setTimeout(r, 800));
          attempts += 1;
        }
        setItinerary(loadedItems || []);
      } else {
        // Local placeholder generation
        const placeholder: ItineraryItem[] = [
          { id: crypto.randomUUID(), day: 1, time: '10:00', title: 'City Museum Tour', description: 'Explore local culture and history', type: 'attraction', location: 'City Center', price: 25, booked: false },
          { id: crypto.randomUUID(), day: 1, time: '13:00', title: 'Food Market Lunch', description: 'Taste authentic dishes', type: 'restaurant', location: 'Old Town', price: 15, booked: false },
          { id: crypto.randomUUID(), day: 2, time: '09:00', title: 'Art Gallery Visit', description: 'Modern and classical art exhibits', type: 'attraction', location: 'Art District', price: 20, booked: false },
        ];
        localStorage.setItem(`itinerary:${tripId}`, JSON.stringify(placeholder));
        setItinerary(placeholder);
      }
      setShowAIPreferences(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (apiAvailable && itineraryId) {
        // No item-level endpoints provided in the flow; keep local updates for now
        const current = [...itinerary];
        if (editingItem) {
          const index = current.findIndex(i => i.id === editingItem.id);
          if (index !== -1) {
            current[index] = { ...current[index], ...formData } as ItineraryItem;
          }
        } else {
          const newItem: ItineraryItem = {
            id: crypto.randomUUID(),
            ...formData,
            booked: formData.booked ?? false,
          } as ItineraryItem;
          current.push(newItem);
        }
        setItinerary(current);
      } else {
        // Local fallback: persist to localStorage
        const current = [...itinerary];
        if (editingItem) {
          const index = current.findIndex(i => i.id === editingItem.id);
          if (index !== -1) {
            current[index] = { ...current[index], ...formData } as ItineraryItem;
          }
        } else {
          const newItem: ItineraryItem = {
            id: crypto.randomUUID(),
            ...formData,
            booked: formData.booked ?? false,
          } as ItineraryItem;
          current.push(newItem);
        }
        localStorage.setItem(`itinerary:${tripId}`, JSON.stringify(current));
        setItinerary(current);
      }
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to save itinerary item');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      if (apiAvailable && itineraryId) {
        // No item delete endpoint provided; update locally
        const filtered = itinerary.filter(i => i.id !== itemId);
        setItinerary(filtered);
      } else {
        const filtered = itinerary.filter(i => i.id !== itemId);
        localStorage.setItem(`itinerary:${tripId}`, JSON.stringify(filtered));
        setItinerary(filtered);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete item');
    }
  };

  const handleEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setFormData({
      day: item.day,
      time: item.time,
      title: item.title,
      description: item.description,
      type: item.type,
      location: item.location,
      price: item.price || 0,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      day: 1,
      time: '09:00',
      title: '',
      description: '',
      type: 'attraction',
      location: '',
      price: 0,
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const generateAlternativeItinerary = async () => {
    try {
      setLoading(true);
      // Ensure we have an itineraryId; if not, try to load first
      let targetId = itineraryId;
      if (apiAvailable && !targetId) {
        try {
          await loadItinerary();
          targetId = itineraryId;
        } catch {}
      }

      if (apiAvailable && targetId) {
        const constraints: any = {
          weather: structuredPlan?.constraintsUsed?.weather || preferences.weather,
          budget: structuredPlan?.constraintsUsed?.budget || preferences.budget,
          timeLimits: structuredPlan?.constraintsUsed?.timeLimits || preferences.timeLimits,
          groupSize: structuredPlan?.constraintsUsed?.groupSize || preferences.groupSize,
        };
        try {
          await apiFetch<void>(routes.itineraries.alternatives(targetId), {
            method: 'POST',
            body: { constraints }
          });
        } catch (e: any) {
          // Surface server error but continue with local fallback
          const msg = typeof e?.message === 'string' ? e.message : 'Failed to request alternatives';
          setError(msg);
        }
        // Refresh itinerary after request
        await loadItinerary();
      } else {
        // Local fallback: simple shuffle of current items as a placeholder
        const shuffled = [...itinerary]
          .map(i => ({ i, r: Math.random() }))
          .sort((a, b) => a.r - b.r)
          .map(({ i }, idx) => ({ ...i, day: (idx % Math.max(1, i.day)) + 1 }));
        localStorage.setItem(`itinerary:${tripId}`, JSON.stringify(shuffled));
        setItinerary(shuffled);
      }
    } catch (err: any) {
      // Show server error and apply a local fallback alternative to keep UX responsive
      try {
        const msg = typeof err?.message === 'string' ? err.message : 'Failed to generate alternative itinerary';
        setError(msg);
      } catch {
        setError('Failed to generate alternative itinerary');
      }
      const shuffled = [...itinerary]
        .map(i => ({ i, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(({ i }, idx) => ({ ...i, day: (idx % Math.max(1, i.day)) + 1 }));
      localStorage.setItem(`itinerary:${tripId}`, JSON.stringify(shuffled));
      setItinerary(shuffled);
    } finally {
      setLoading(false);
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
            <p className="text-luxury-600">Loading itinerary...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-semibold text-luxury-900">Itinerary</h2>
        <div className="flex space-x-3">
          <Button variant="primary" onClick={generateAlternativeItinerary}>
            <Wand2 className="w-4 h-4" />
            <span>Generate Alternative</span>
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
          {itinerary.length === 0 && (
            <Button onClick={() => setShowAIPreferences(true)}>
              Plan with AI
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Structured AI Plan View */}
      {structuredPlan?.plan && (
        <div className="space-y-6">
          {/* Summary */}
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-luxury-600">Destination</div>
                <div className="text-lg font-medium text-luxury-900">{structuredPlan.plan.summary?.destination}</div>
              </div>
              <div>
                <div className="text-sm text-luxury-600">Duration</div>
                <div className="text-lg font-medium text-luxury-900">{structuredPlan.plan.summary?.duration} days</div>
              </div>
              <div>
                <div className="text-sm text-luxury-600">Estimated Cost</div>
                <div className="text-lg font-medium text-luxury-900">{structuredPlan.plan.summary?.totalEstimatedCost}</div>
              </div>
            </div>
            {Array.isArray(structuredPlan.plan.summary?.highlights) && structuredPlan.plan.summary.highlights.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-luxury-600 mb-2">Highlights</div>
                <ul className="list-disc list-inside text-luxury-800 space-y-1">
                  {structuredPlan.plan.summary.highlights.map((h: string, idx: number) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </GlassCard>

          {/* Daily Plans */}
          {Array.isArray(structuredPlan.plan.dailyPlans) && structuredPlan.plan.dailyPlans.length > 0 && (
            <div className="space-y-4">
              {structuredPlan.plan.dailyPlans.map((dayPlan: any) => (
                <GlassCard key={dayPlan._id || dayPlan.day} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xl font-serif font-semibold text-luxury-900">Day {dayPlan.day} • {new Date(dayPlan.date).toLocaleDateString()}</div>
                    <div className="text-sm text-luxury-600">Total: {dayPlan.totalDayCost}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['morning','afternoon','evening'].map((slot) => (
                      <div key={slot} className="bg-white/70 border border-luxury-200 rounded-xl p-4">
                        <div className="text-sm uppercase tracking-wide text-luxury-500 mb-1">{slot}</div>
                        <div className="font-medium text-luxury-900">{dayPlan[slot]?.activity}</div>
                        <div className="text-sm text-luxury-600">{dayPlan[slot]?.location}</div>
                        <div className="text-xs text-luxury-500">{dayPlan[slot]?.duration} • {dayPlan[slot]?.cost}</div>
                        {dayPlan[slot]?.notes && (
                          <div className="text-sm text-luxury-700 mt-1">{dayPlan[slot]?.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {dayPlan.meals && (
                      <div className="bg-white/70 border border-luxury-200 rounded-xl p-4">
                        <div className="font-medium text-luxury-900 mb-1">Meals</div>
                        <div className="text-luxury-700">Breakfast: {dayPlan.meals.breakfast}</div>
                        <div className="text-luxury-700">Lunch: {dayPlan.meals.lunch}</div>
                        <div className="text-luxury-700">Dinner: {dayPlan.meals.dinner}</div>
                      </div>
                    )}
                    <div className="bg-white/70 border border-luxury-200 rounded-xl p-4">
                      <div className="font-medium text-luxury-900 mb-1">Transportation</div>
                      <div className="text-luxury-700">{dayPlan.transportation}</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {structuredPlan.plan.recommendations && (
            <GlassCard className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.isArray(structuredPlan.plan.recommendations.packing) && (
                  <div>
                    <div className="text-sm text-luxury-600 mb-2">Packing</div>
                    <ul className="list-disc list-inside text-luxury-800 space-y-1">
                      {structuredPlan.plan.recommendations.packing.map((p: string, idx: number) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(structuredPlan.plan.recommendations.tips) && (
                  <div>
                    <div className="text-sm text-luxury-600 mb-2">Tips</div>
                    <ul className="list-disc list-inside text-luxury-800 space-y-1">
                      {structuredPlan.plan.recommendations.tips.map((t: string, idx: number) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(structuredPlan.plan.recommendations.alternatives) && (
                  <div>
                    <div className="text-sm text-luxury-600 mb-2">Alternatives</div>
                    <ul className="list-disc list-inside text-luxury-800 space-y-1">
                      {structuredPlan.plan.recommendations.alternatives.map((a: string, idx: number) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Metadata */}
          {(structuredPlan.generationMetadata || structuredPlan.constraintsUsed) && (
            <GlassCard className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                {structuredPlan.generationMetadata && (
                  <div>
                    <div className="text-luxury-600 mb-2">Generated by {structuredPlan.generationMetadata.aiProvider} • Model {structuredPlan.generationMetadata.modelUsed}</div>
                    <div className="text-luxury-700">Time: {structuredPlan.generationMetadata.generationTime}ms</div>
                  </div>
                )}
                {structuredPlan.constraintsUsed && (
                  <div>
                    <div className="text-luxury-600 mb-2">Constraints</div>
                    <div className="text-luxury-700">Budget: {structuredPlan.constraintsUsed.budget || 'n/a'}</div>
                    <div className="text-luxury-700">Group Size: {structuredPlan.constraintsUsed.groupSize || 'n/a'}</div>
                    {Array.isArray(structuredPlan.constraintsUsed.interests) && (
                      <div className="text-luxury-700">Interests: {structuredPlan.constraintsUsed.interests.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* AI Preferences Form */}
      {showAIPreferences && (
        <GlassCard className="p-6">
          <form onSubmit={handleGenerateAI} className="space-y-4">
            <h3 className="text-xl font-serif font-semibold text-luxury-900">Tell us your preferences</h3>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Interests</label>
                <div className="flex flex-wrap gap-2">
                  {['culture','food','history','art','nature','nightlife'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleInterest(opt)}
                      className={`px-3 py-1 rounded-full border ${preferences.interests.includes(opt) ? 'bg-gold-500 text-white border-gold-500' : 'bg-white/80 text-luxury-700 border-luxury-300'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Budget</label>
                <select
                  value={preferences.budget}
                  onChange={(e) => setPreferences(p => ({ ...p, budget: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg"
                >
                  <option value="low">low</option>
                  <option value="moderate">moderate</option>
                  <option value="high">high</option>
                  <option value="luxury">luxury</option>
                </select>
                {tripDefaults.budgetNumber && (
                  <div className="text-xs text-luxury-600 mt-1">From trip: ₹{tripDefaults.budgetNumber?.toLocaleString()}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Group Size</label>
                <input
                  type="number"
                  min={1}
                  value={preferences.groupSize || 1}
                  onChange={(e) => setPreferences(p => ({ ...p, groupSize: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg"
                />
                {tripDefaults.participants && (
                  <div className="text-xs text-luxury-600 mt-1">From trip: {tripDefaults.participants}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Time Limits</label>
                <select
                  value={preferences.timeLimits}
                  onChange={(e) => setPreferences(p => ({ ...p, timeLimits: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg"
                >
                  <option value="tight">tight</option>
                  <option value="standard">standard</option>
                  <option value="flexible">flexible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Weather</label>
                <select
                  value={preferences.weather}
                  onChange={(e) => setPreferences(p => ({ ...p, weather: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg"
                >
                  <option value="spring">spring</option>
                  <option value="summer">summer</option>
                  <option value="autumn">autumn</option>
                  <option value="winter">winter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Accessibility</label>
                <select
                  value={preferences.accessibility}
                  onChange={(e) => setPreferences(p => ({ ...p, accessibility: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg"
                >
                  <option value="standard">standard</option>
                  <option value="reduced-mobility">reduced-mobility</option>
                  <option value="family">family</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  try {
                    localStorage.removeItem(`ai-plan:${tripId}`);
                    localStorage.removeItem(`ai-seed:${tripId}`);
                  } catch {}
                  onNavigate('trips');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Generate with AI</Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <GlassCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Day</label>
                <input
                  type="number"
                  min="1"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-luxury-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                placeholder="Activity title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-luxury-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                rows={3}
                placeholder="Activity description"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                >
                  <option value="flight">Flight</option>
                  <option value="hotel">Hotel</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="attraction">Attraction</option>
                  <option value="transport">Transport</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  placeholder="Location"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-luxury-700 mb-2">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Update' : 'Add'} Item
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Itinerary List */}
      {itinerary.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-luxury-600 mb-4">No itinerary items yet.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            Add First Item
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {itinerary
            .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
            .map((item) => {
              const IconComponent = typeIcons[item.type];
              const iconColor = typeColors[item.type];
              
              return (
                <GlassCard key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white/50 ${iconColor}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-luxury-600">Day {item.day}</span>
                          <Clock className="w-4 h-4 text-luxury-500" />
                          <span className="text-sm text-luxury-600">{item.time}</span>
                        </div>
                        <h3 className="font-semibold text-luxury-900">{item.title}</h3>
                        <p className="text-sm text-luxury-600">{item.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="w-3 h-3 text-luxury-500" />
                          <span className="text-xs text-luxury-600">{item.location}</span>
                          {item.price && item.price > 0 && (
                            <>
                              <DollarSign className="w-3 h-3 text-luxury-500" />
                              <span className="text-xs text-luxury-600">₹{item.price.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
        </div>
      )}
    </div>
  );
};
