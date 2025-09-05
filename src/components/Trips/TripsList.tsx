import React, { useState } from 'react';
import { Calendar, MapPin, Users, Star, Trash2, X, ArrowLeft, Plus} from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useTrips } from '../../hooks/useTrips';
import { Trip } from '../../types';

interface TripsListProps {
  onNavigate: (view: string, tripId?: string) => void;
}

export const TripsList: React.FC<TripsListProps> = ({ onNavigate }) => {
  const { trips, deleteTrip } = useTrips();
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // State for the custom delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);

  const handleDeleteTrip = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTripToDelete(tripId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;

    try {
      setDeletingTripId(tripToDelete);
      await deleteTrip(tripToDelete);
      setNotification({ message: 'Trip deleted successfully!', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      setNotification({ message: `Failed to delete trip: ${error?.message || 'Unknown error'}`, type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setDeletingTripId(null);
      setTripToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setTripToDelete(null);
    setShowDeleteConfirm(false);
  };

  const getStatusColor = (status?: Trip['status'] | 'ongoing') => {
    switch (status) {
      case 'upcoming': return 'text-purple-400';
      case 'past': return 'text-teal-400';
      case 'ongoing': return 'text-emerald-400';
      case 'draft': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusLabel = (status?: Trip['status'] | 'ongoing') => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'past': return 'Completed';
      case 'ongoing': return 'Ongoing';
      case 'draft': return 'Draft';
      default: return 'Draft';
    }
  };

  // If a trip is finalized, derive display status from dates
  const getEffectiveStatus = (trip?: Trip): Trip['status'] | 'ongoing' => {
    if (!trip) return 'draft';
    const raw = trip.status;
    if (raw !== 'finalized') return raw;
    // Compute based on dates
    const today = new Date();
    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;
    if (start && start.getTime() > today.getTime()) return 'upcoming';
    if (end && end.getTime() < today.getTime()) return 'past';
    return 'ongoing';
  };

  const handleTripClick = (tripId: string) => {
    onNavigate('trip-details', tripId);
  };

  // removed debug logging
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-purple-300/20 rounded-full animate-float blur-sm"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-fuchsia-200/25 to-fuchsia-300/15 rounded-full animate-float-delayed blur-sm"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-gradient-to-br from-indigo-200/20 to-indigo-300/10 rounded-full animate-pulse-slow blur-sm"></div>
        
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
                ? 'bg-teal-500/80 text-white' 
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
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
            <GlassCard className="p-8 text-center max-w-md animate-zoom-in">
              <h3 className="text-xl font-serif font-semibold text-slate-900 mb-4">Confirm Deletion</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete this trip? This action cannot be undone.</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelDelete}
                  className="group relative flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-lg hover:scale-105"
                >
                  <span className="relative z-10">Cancel</span>
                </button>
                <button
                  onClick={confirmDelete}
                  className="group relative bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500 hover:from-rose-600 hover:via-rose-500 hover:to-rose-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/50 hover:scale-105 transform active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  <span className="relative z-10">Delete</span>
                </button>
              </div>
            </GlassCard>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12 animate-fade-in">
            <div>
              <h1 className="text-5xl font-serif font-bold text-slate-900 mb-4">
                My <span className="text-indigo-500 animate-gradient bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent bg-300%">Journeys</span>
              </h1>
              <p className="text-xl text-slate-700">Your collection of luxury experiences</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('dashboard')}
                className="group relative flex items-center px-6 py-3 rounded-xl font-semibold text-md transition-all duration-300 bg-white/80 hover:bg-white hover:shadow-lg hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => onNavigate('create-trip')}
                className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-teal-600 hover:via-teal-500 hover:to-teal-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-105 transform active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-3" />
                  <span>Plan New Trip</span>
                </div>
              </button>
            </div>
          </div>

        {!trips || trips.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-8 bg-white/60 rounded-full flex items-center justify-center">
              <MapPin className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-serif font-semibold text-slate-900 mb-4">No trips yet</h3>
            <p className="text-slate-600 mb-8">Start planning your first luxury adventure</p>
            <button
              onClick={() => onNavigate('create-trip')}
              className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-teal-600 hover:via-teal-500 hover:to-teal-600 text-white px-12 py-6 rounded-2xl font-semibold text-xl transition-all duration-500 hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-105 transform active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center">
                <Plus className="w-7 h-7 mr-3" />
                <span className="group-hover:text-white transition-colors duration-300">Plan Your First Trip</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip, index) => (
              <div 
                key={trip?.id || `trip-${index}`}
                className="animate-slide-up group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GlassCard className="overflow-hidden cursor-pointer">
                  <div 
                    className="relative h-56"
                    onClick={() => trip?.id && handleTripClick(trip.id)}
                  >
                    <img 
                      src={trip?.image || 'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&cs=tinysrgb&w=800'} 
                      alt={trip?.title || 'Trip'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Status Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getEffectiveStatus(trip))} bg-white/20 backdrop-blur-sm`}>
                      {getStatusLabel(getEffectiveStatus(trip))}
                    </div>

                    {/* Delete Button */}
                    {trip?.id && (
                      <button
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        disabled={deletingTripId === trip.id}
                        className={`absolute top-4 right-4 w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                          deletingTripId === trip.id 
                            ? 'bg-fuchsia-500/40 text-fuchsia-300 cursor-not-allowed' 
                            : 'bg-fuchsia-500/20 hover:bg-fuchsia-500/40 text-fuchsia-400 hover:text-fuchsia-300'
                        }`}
                      >
                        {deletingTripId === trip.id ? (
                          <div className="w-4 h-4 border-2 border-fuchsia-300/30 border-t-fuchsia-300 rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Trip Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-xl font-serif font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">
                        {trip?.title || 'Untitled Trip'}
                      </h3>
                      <div className="flex items-center space-x-4 text-white/80 text-sm mb-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{trip?.destination || 'Unknown Destination'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{trip?.participants || 1}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">{trip?.startDate || 'TBD'} - {trip?.endDate || 'TBD'}</span>
                        <span className="text-purple-300 font-semibold">₹{(trip?.budget || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
</div>
  );
};