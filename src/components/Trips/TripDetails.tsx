import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, ArrowLeft, Plus, Edit, Trash2, X } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useTrips } from '../../hooks/useTrips';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';

interface TripDetailsProps {
  tripId: string;
  onNavigate: (view: string, tripId?: string) => void;
}

export const TripDetails: React.FC<TripDetailsProps> = ({ tripId, onNavigate }) => {
  const { getTripById, deleteTrip } = useTrips();
  const trip = getTripById(tripId);
  const [fullTrip, setFullTrip] = useState<any>(trip);
  const [isLoading, setIsLoading] = useState<boolean>(!trip);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [tripStatus, setTripStatus] = useState<'upcoming' | 'past' | 'draft' | 'finalized'>(trip?.status || 'draft');
  const [itineraryId, setItineraryId] = useState<string | null>(null);
  const [itineraryStatus, setItineraryStatus] = useState<'draft' | 'finalized' | null>(null);
  const [aiBudget, setAiBudget] = useState<number | null>(null);
  const selectedBudget: number = Number((fullTrip as any)?.budget ?? (fullTrip as any)?.selections?.budget ?? (fullTrip as any)?.preferences?.budget ?? 0);

  useEffect(() => {
    setFullTrip(trip);
    setTripStatus((trip?.status as any) || 'draft');
  }, [trip?.id, trip?.status]);

  useEffect(() => {
    const fetchFullTrip = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const raw = await apiFetch<any>(routes.trips.byId(tripId));
        const t = raw?.data || raw;
        const formatted = t ? { ...t, id: t.id || t._id } : null;
        setFullTrip(formatted);
        if (formatted?.status) setTripStatus(formatted.status);
      } catch (e: any) {
        setLoadError(e?.message || 'Failed to load trip');
      } finally {
        setIsLoading(false);
      }
    };
    if (!trip) fetchFullTrip();
  }, [tripId]);

  useEffect(() => {
    const loadItineraryMeta = async () => {
      try {
        const raw = await apiFetch<any>(routes.trips.itineraryByTrip(tripId));
        const wrap = raw?.success ? raw.data : raw;
        const res = wrap?.data?.itinerary || wrap?.itinerary || wrap?.data || wrap;
        const id: string | undefined = res?.id || res?._id || res?.itineraryId || res?.itinerary?._id;
        const status: string | undefined = res?.status || res?.itinerary?.status;
        if (id) setItineraryId(id);
        if (status === 'draft' || status === 'finalized') setItineraryStatus(status as any);
      } catch (e: any) {
        // ignore if none
      }
    };
    loadItineraryMeta();
  }, [tripId]);

  useEffect(() => {
    const loadAiBudget = async () => {
      if (!itineraryId) return;
      try {
        const raw = await apiFetch<any>(routes.cart.budget(tripId));
        const res = raw?.success ? raw.data : raw;
        const value = res?.total ?? res?.data?.total ?? res?.budget ?? res?.aiEstimate ?? null;
        if (typeof value === 'number') setAiBudget(value);
      } catch {}
    };
    loadAiBudget();
  }, [tripId, itineraryId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading trip details…</div>
      </div>
    );
  }

  if (!fullTrip) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        
        <div className="relative z-10 pt-24 px-6 flex items-center justify-center min-h-screen">
          <GlassCard className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-serif font-semibold text-slate-900 mb-4">Trip not found</h2>
            <div className="text-slate-600 mb-4">{loadError || 'We could not find this trip.'}</div>
            <Button variant="secondary" onClick={() => onNavigate('trips')}>Back to Trips</Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  const handleDeleteTrip = async () => {
    try {
      await deleteTrip(fullTrip.id);
      setNotification({ message: 'Trip deleted successfully!', type: 'success' });
      setTimeout(() => {
        onNavigate('trips');
      }, 1000);
    } catch (error: any) {
      setNotification({ message: `Failed to delete trip: ${error?.message || 'Unknown error'}`, type: 'error' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleEditTrip = () => {
    onNavigate('edit-trip', fullTrip.id);
  };

  const handleFinalizeItinerary = async () => {
    if (!itineraryId) return;
    try {
      await apiFetch<void>(routes.itineraries.status(itineraryId), {
        method: 'PATCH',
        body: { status: 'finalized' }
      });
      setItineraryStatus('finalized');
      setNotification({ message: 'Itinerary finalized', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      setNotification({ message: e?.message || 'Failed to finalize itinerary', type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleFinalizeTrip = async () => {
    try {
      await apiFetch<void>(routes.trips.status(fullTrip.id), {
        method: 'PATCH',
        body: { status: 'finalized' }
      });
      setTripStatus('finalized');
      setNotification({ message: 'Trip finalized', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      setNotification({ message: e?.message || 'Failed to finalize trip', type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-amber-300/20 rounded-full animate-float blur-sm"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/25 to-blue-300/15 rounded-full animate-float-delayed blur-sm"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-gradient-to-br from-emerald-200/20 to-emerald-300/10 rounded-full animate-pulse-slow blur-sm"></div>
        <div className="absolute top-32 left-1/2 w-32 h-32 bg-gradient-to-br from-rose-200/25 to-rose-300/15 rounded-full animate-bounce-slow blur-sm"></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 pt-24 px-6 pb-24">
        {/* Notification Toast */}
        {notification && (
          <div 
            key={`notification-${notification.type}`}
            className={`fixed top-24 right-6 z-50 p-4 rounded-xl shadow-lg transition-all duration-300 transform animate-fade-in-right ${
              notification.type === 'success' 
                ? 'bg-emerald-500/80 text-white' 
                : 'bg-rose-500/80 text-white'
            } backdrop-blur-md`}
          >
            <div className="flex items-center space-x-2">
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="ml-2 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('trips')}
              className="group flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-lg hover:scale-105"
            >
              <ArrowLeft className="w-6 h-6 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="relative z-10">Back to Trips</span>
            </button>
            <div className="flex space-x-3">
              {tripStatus === 'draft' ? (
                <>
                  <button
                    onClick={handleEditTrip}
                    className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transform active:scale-95 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <div className="relative flex items-center space-x-2">
                      <Edit className="w-5 h-5" />
                      <span>Edit Trip</span>
                    </div>
                  </button>
                  <button
                    onClick={handleFinalizeTrip}
                    className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    Finalize Trip
                  </button>
                  <button 
                    onClick={handleDeleteTrip}
                    className="group relative flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 text-rose-500 hover:text-white hover:bg-rose-600 hover:shadow-lg hover:scale-105"
                  >
                    <div className="relative flex items-center space-x-2">
                      <Trash2 className="w-5 h-5" />
                      <span>Delete Trip</span>
                    </div>
                  </button>
                </>
              ) : itineraryStatus !== 'finalized' ? (
                <>
                  <button
                    onClick={() => onNavigate('view-itinerary', fullTrip.id)}
                    className="group relative bg-white/90 text-slate-800 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 border border-slate-200"
                  >
                    View Itinerary
                  </button>
                  <button
                    onClick={() => onNavigate('plan-with-ai', fullTrip.id)}
                    className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    Plan with AI
                  </button>
                  {itineraryId && (
                    <button
                      onClick={handleFinalizeItinerary}
                      className="group relative bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                    >
                      Finalize Itinerary
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('view-itinerary', fullTrip.id)}
                    className="group relative bg-white/90 text-slate-800 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 border border-slate-200">
                    View Itinerary
                  </button>
                  <button
                    onClick={() => onNavigate('plan-with-ai', fullTrip.id)}
                    className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105">
                    Plan with AI
                  </button>
                </>
              )}
            </div>
          </div>

          <GlassCard className="overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
            <div className="relative h-72">
              <img 
                src={fullTrip.image || 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920'} 
                alt={fullTrip.title || 'trip'} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920';
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h1 className="text-3xl font-serif font-bold">{fullTrip.title}</h1>
                <div className="flex items-center space-x-4 text-white/80 mt-2">
                  <span className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-amber-200" /><span>{fullTrip.destination}</span></span>
                  {(fullTrip as any).originStation && (
                    <span className="flex items-center space-x-1"><MapPin className="w-4 h-4 text-emerald-200" /><span>{(fullTrip as any).originStation}</span></span>
                  )}
                  {fullTrip?.startDate && fullTrip?.endDate && (
                    <span className="flex items-center space-x-1"><Calendar className="w-4 h-4 text-blue-200" /><span>{new Date(fullTrip.startDate).toLocaleDateString()} - {new Date(fullTrip.endDate).toLocaleDateString()}</span></span>
                  )}
                  {typeof fullTrip.participants !== 'undefined' && (
                    <span className="flex items-center space-x-1"><Users className="w-4 h-4 text-rose-200" /><span>{fullTrip.participants}</span></span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="text-slate-700">
                <div className="text-sm">Selected Budget</div>
                <div className="text-2xl font-serif font-bold text-amber-500">₹{selectedBudget.toLocaleString()}</div>
              </div>
              <div className="text-slate-700">
                <div className="text-sm">Group Size</div>
                <div className="text-2xl font-serif font-bold text-slate-800">
                  {Number((fullTrip as any)?.participants ?? (fullTrip as any)?.groupSize ?? (fullTrip as any)?.selections?.participants ?? (fullTrip as any)?.preferences?.groupSize ?? 0) || 1}
                </div>
              </div>
              {aiBudget !== null && (
                <div className="text-slate-700">
                  <div className="text-sm">AI Estimate</div>
                  <div className="text-2xl font-serif font-bold text-emerald-500">₹{aiBudget.toLocaleString()}</div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tripStatus === 'upcoming' ? 'bg-blue-100/80 text-blue-800' :
                  tripStatus === 'past' ? 'bg-emerald-100/80 text-emerald-800' :
                  tripStatus === 'finalized' ? 'bg-amber-100/80 text-amber-800' :
                  'bg-slate-100/80 text-slate-800'
                } backdrop-blur-sm`}>
                  {tripStatus.charAt(0).toUpperCase() + tripStatus.slice(1)}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Conditional Trip Actions based on itinerary finalized */}
          <div className="text-center py-8 flex items-center justify-center gap-4 flex-wrap">
            {itineraryStatus === 'finalized' && itineraryId && (
              <>
                <button
                  onClick={() => onNavigate('itinerary', fullTrip.id)}
                  className="group relative bg-white/90 text-slate-800 px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 border border-slate-200"
                >
                  View Itinerary
                </button>
                <button
                  onClick={() => {
                    try { localStorage.setItem(`ai-plan:${fullTrip.id}`, '1'); } catch {}
                    onNavigate('itinerary', fullTrip.id);
                  }}
                  className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Generate Alternative
                </button>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <GlassCard className="p-6 group hover:scale-[1.01] transition-transform duration-300">
            <h3 className="text-xl font-serif font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('explore')}
                className="group relative flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 bg-white/80 hover:bg-white hover:shadow-lg hover:scale-105"
              >
                <div className="relative z-10 flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Explore Experiences</span>
                </div>
              </button>
              <button
                onClick={() => onNavigate('cart')}
                className="group relative flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 bg-white/80 hover:bg-white hover:shadow-lg hover:scale-105"
              >
                <div className="relative z-10 flex items-center space-x-2">
                  <span>View Cart</span>
                </div>
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};