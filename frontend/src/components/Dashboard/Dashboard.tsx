import React, { useState, useEffect } from 'react';
import { Crown, Calendar, MapPin, Star, TrendingUp, Plus, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTrips } from '../../hooks/useTrips';
import { Trip } from '../../types';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

interface DashboardStats {
  upcomingTrips: number;
  pastTrips: number;
  draftTrips: number;
  totalSpent: number;
  averageRating: number;
  goldenMiles: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'trip_created' | 'trip_completed' | 'booking_made' | 'achievement_earned';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { trips, isLoading: tripsLoading, error: tripsError } = useTrips();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      // Helper to derive effective status for finalized trips
      const getEffectiveStatus = (trip: Trip): Trip['status'] | 'ongoing' => {
        if (trip.status !== 'finalized') return trip.status;
        const today = new Date();
        const start = trip.startDate ? new Date(trip.startDate) : null;
        const end = trip.endDate ? new Date(trip.endDate) : null;
        if (start && start.getTime() > today.getTime()) return 'upcoming';
        if (end && end.getTime() < today.getTime()) return 'past';
        return 'ongoing';
      };

      // Parse budget/cost from various possible formats
      const parseAmount = (raw: unknown): number => {
        if (typeof raw === 'number' && isFinite(raw)) return raw;
        if (typeof raw === 'string') {
          // Extract numbers from strings like "INR 25,000 - 35,000"
          const nums = raw
            .replace(/,/g, '')
            .match(/\d+(?:\.\d+)?/g);
          if (nums && nums.length > 0) {
            // If a range, average the endpoints; otherwise take the first
            if (nums.length >= 2) {
              const a = Number(nums[0]);
              const b = Number(nums[1]);
              if (isFinite(a) && isFinite(b)) return Math.round((a + b) / 2);
            }
            const first = Number(nums[0]);
            if (isFinite(first)) return first;
          }
        }
        return 0;
      };

      const getTripCost = (trip: Trip): number => {
        // Prefer numeric budget; fallback to summary estimate if available
        const fromBudget = parseAmount((trip as any)?.budget);
        if (fromBudget > 0) return fromBudget;
        const summary = (trip as any)?.summary;
        if (summary && typeof summary.totalEstimatedCost !== 'undefined') {
          const fromSummary = parseAmount(summary.totalEstimatedCost);
          if (fromSummary > 0) return fromSummary;
        }
        return 0;
      };

      // Compute stats locally from available trips data (derived statuses)
      const upcomingTrips = trips.filter(trip => getEffectiveStatus(trip) === 'upcoming');
      const pastTrips = trips.filter(trip => getEffectiveStatus(trip) === 'past');
      const draftTrips = trips.filter(trip => trip.status === 'draft');

      setStats({
        upcomingTrips: upcomingTrips.length,
        pastTrips: pastTrips.length,
        draftTrips: draftTrips.length,
        totalSpent: trips
          .filter(trip => trip.status === 'finalized')
          .reduce((sum, trip) => sum + getTripCost(trip), 0),
        averageRating: 4.8,
        goldenMiles: user?.goldenMiles || 0,
        recentActivity: trips.slice(0, 3).map(trip => ({
          id: trip.id,
          type: trip.status === 'past' ? 'trip_completed' : 'trip_created',
          title: trip.title,
          description: trip.status === 'past' ? 'Trip completed' : 'Trip created',
          timestamp: trip.startDate,
          icon: trip.status === 'past' ? 'CheckCircle' : 'Calendar',
          color: trip.status === 'past' ? 'text-green-500' : 'text-blue-500'
        }))
      });

      setLoading(false);
    };

    loadDashboardData();
  }, [user?.id, trips]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-10"></div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-amber-200/20 rounded-full animate-float"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-200/15 rounded-full animate-float-delayed"></div>
        </div>
        
        <div className="relative z-10 pt-24 px-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-amber-400/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-slate-600 text-lg font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-10"></div>
        </div>
        
        <div className="relative z-10 pt-24 px-6 flex items-center justify-center min-h-screen">
          <GlassCard className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-serif font-semibold text-slate-900 mb-4">Failed to load dashboard</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const getEffectiveStatus = (trip: Trip): Trip['status'] | 'ongoing' => {
    if (trip.status !== 'finalized') return trip.status;
    const today = new Date();
    const start = trip.startDate ? new Date(trip.startDate) : null;
    const end = trip.endDate ? new Date(trip.endDate) : null;
    if (start && start.getTime() > today.getTime()) return 'upcoming';
    if (end && end.getTime() < today.getTime()) return 'past';
    return 'ongoing';
  };

  const upcomingTrips = trips.filter(trip => getEffectiveStatus(trip) === 'upcoming');

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

      <div className="relative z-10 pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section with enhanced animations */}
          <div className={`mb-16 transition-all duration-1500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 text-center md:text-left">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 group-hover:shadow-2xl group-hover:shadow-amber-500/50 transition-all duration-500 group-hover:scale-110">
                  <span className="text-3xl font-serif font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {user?.isPremium && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-pulse-slow">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                )}
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 -z-10"></div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-slate-900 mb-3 leading-tight">
                  Welcome back, <span className="text-amber-500 animate-gradient bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent bg-300%">{user?.name}</span>
                </h1>
                <p className="text-xl text-slate-600 font-light mb-4">
                  {user?.isPremium ? '✨ Premium Member' : '🌟 Explorer'} since {user?.memberSince}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-500">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-amber-400" />
                    <span>Rating: {stats.averageRating}/5.0</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-emerald-400" />
                    <span>{stats.goldenMiles.toLocaleString()} Golden Miles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { 
                value: stats.upcomingTrips, 
                label: 'Upcoming Trips', 
                icon: Calendar, 
                color: 'from-amber-400 to-amber-600',
                shadowColor: 'amber-500',
                delay: 'delay-300'
              },
              { 
                value: stats.pastTrips, 
                label: 'Destinations Visited', 
                icon: MapPin, 
                color: 'from-blue-500 to-blue-700',
                shadowColor: 'blue-500',
                delay: 'delay-500'
              },
              { 
                value: stats.draftTrips, 
                label: 'Draft Itineraries', 
                icon: Clock, 
                color: 'from-rose-500 to-rose-700',
                shadowColor: 'rose-500',
                delay: 'delay-700'
              },
              { 
                value: `₹${stats.totalSpent.toLocaleString()}`, 
                label: 'Total Investment', 
                icon: TrendingUp, 
                color: 'from-emerald-500 to-emerald-700',
                shadowColor: 'emerald-500',
                delay: 'delay-900'
              }
            ].map((stat, index) => (
              <div key={index} className={`animate-fade-in-up ${stat.delay}`}>
                <GlassCard className="p-8 text-center group hover:scale-105 transition-all duration-500 cursor-default">
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-${stat.shadowColor}/25 group-hover:shadow-xl group-hover:shadow-${stat.shadowColor}/40 group-hover:rotate-3 transition-all duration-500`}>
                    <stat.icon className="w-8 h-8 text-white group-hover:animate-pulse" />
                  </div>
                  <div className="text-3xl font-serif font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors duration-300">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 text-sm font-medium group-hover:text-slate-700 transition-colors duration-300">
                    {stat.label}
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>

          {/* Enhanced Quick Actions */}
          <div className={`mb-16 transition-all duration-1500 delay-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8 text-center">
              Quick <span className="text-amber-500 animate-gradient bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent bg-300%">Actions</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="animate-fade-in-up delay-1200">
                <GlassCard className="p-10 text-center group cursor-pointer hover:scale-105 transition-all duration-500 relative overflow-hidden" onClick={() => onNavigate('create-trip')}>
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-xl group-hover:shadow-amber-500/50 group-hover:rotate-6 transition-all duration-500">
                      <Calendar className="w-10 h-10 text-white group-hover:animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-serif font-semibold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors duration-300">Plan New Trip</h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Create your next luxury adventure with AI assistance</p>
                  </div>
                </GlassCard>
              </div>

              <div className="animate-fade-in-up delay-1400">
                <GlassCard className="p-10 text-center group cursor-pointer hover:scale-105 transition-all duration-500 relative overflow-hidden" onClick={() => onNavigate('trips')}>
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/50 group-hover:rotate-6 transition-all duration-500">
                      <MapPin className="w-10 h-10 text-white group-hover:animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-serif font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">My Journeys</h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">View and manage all your travel experiences</p>
                  </div>
                </GlassCard>
              </div>

              <div className="animate-fade-in-up delay-1600">
                <GlassCard className="p-10 text-center group cursor-pointer hover:scale-105 transition-all duration-500 relative overflow-hidden" onClick={() => onNavigate('explore')}>
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-xl group-hover:shadow-emerald-500/50 group-hover:rotate-6 transition-all duration-500">
                      <Star className="w-10 h-10 text-white group-hover:animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-serif font-semibold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">Explore Luxury</h3>
                    <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-300">Discover premium destinations and experiences</p>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>

          {/* Enhanced Recent Activity */}
          <div className={`mb-16 transition-all duration-1500 delay-1800 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8 text-center">
              Recent <span className="text-amber-500 animate-gradient bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent bg-300%">Activity</span>
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={activity.id} className={`animate-fade-in-up`} style={{ animationDelay: `${2000 + index * 200}ms` }}>
                  <GlassCard className="p-6 group hover:scale-[1.02] transition-all duration-300">
                    <div className="flex items-center space-x-6">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activity.color} bg-white/80 group-hover:bg-white transition-colors duration-300 shadow-lg`}>
                        {activity.type === 'trip_completed' ? (
                          <CheckCircle className="w-6 h-6 group-hover:animate-pulse" />
                        ) : (
                          <Calendar className="w-6 h-6 group-hover:animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-900 font-semibold text-lg group-hover:text-amber-600 transition-colors duration-300">{activity.title}</h3>
                        <p className="text-slate-600 group-hover:text-slate-700 transition-colors duration-300">{activity.description}</p>
                      </div>
                      <span className="text-slate-500 text-sm font-medium">{activity.timestamp}</span>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Upcoming Trips */}
          {upcomingTrips.length > 0 && (
            <div className={`mb-16 transition-all duration-1500 delay-2400 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <h2 className="text-4xl font-serif font-bold text-slate-900 mb-8 text-center">
                Upcoming <span className="text-amber-500 animate-gradient bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent bg-300%">Adventures</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {upcomingTrips.slice(0, 3).map((trip, index) => (
                  <div key={trip.id} className={`animate-fade-in-up`} style={{ animationDelay: `${2600 + index * 200}ms` }}>
                    <GlassCard className="overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500 relative" onClick={() => onNavigate('trip-details') /* id passed via global nav state elsewhere */}>
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 z-20"></div>
                      
                      <div className="relative h-56">
                        <img 
                          src={trip.image} 
                          alt={trip.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent group-hover:from-black/70 transition-all duration-500"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                          <h3 className="text-xl font-serif font-semibold text-white mb-2 group-hover:text-amber-200 transition-colors duration-300">{trip.title}</h3>
                          <p className="text-white/90 text-sm group-hover:text-white transition-colors duration-300">{trip.destination}</p>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>{trip.startDate}</span>
                          </div>
                          <span className="text-amber-500 font-bold text-lg">₹{trip.budget.toLocaleString()}</span>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
              
              {/* Enhanced Navigation to All Trips */}
              <div className="text-center mt-12">
                <Button 
                  onClick={() => onNavigate('trips')} 
                  variant="secondary"
                  className="group relative overflow-hidden px-8 py-4 text-lg font-semibold"
                >
                  <span className="relative z-10">View All Trips</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>
            </div>
          )}
          
          {/* Enhanced Empty State */}
          {upcomingTrips.length === 0 && (
            <div className={`text-center py-20 transition-all duration-1500 delay-2400 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="max-w-2xl mx-auto">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse-slow">
                  <Plus className="w-16 h-16 text-white" />
                </div>
                
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-6">Ready for Your Next Adventure?</h2>
                <p className="text-xl text-slate-600 mb-12 font-light leading-relaxed">
                  Let our AI concierge craft the perfect luxury experience tailored just for you
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button
                    onClick={() => onNavigate('create-trip')}
                    className="group relative w-full sm:w-auto bg-gradient-to-r from-yellow-500 via-yelow-400 to-yellow-600 hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600 text-white px-12 py-6 rounded-2xl font-semibold text-xl transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105 transform active:scale-95 overflow-hidden"
                  >
                    {/* Animated background overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    
                    {/* Button content */}
                    <div className="relative flex items-center justify-center">
                      <Calendar className="w-7 h-7 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="group-hover:text-white transition-colors duration-300">Plan with AI</span>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10"></div>
                    </div>
                  </button>
                  
                  <Button 
                    onClick={() => onNavigate('explore')} 
                    variant="secondary" 
                    size="lg"
                    className="w-full sm:w-auto group relative overflow-hidden px-8 py-6 text-lg"
                  >
                    <span className="relative z-10 flex items-center">
                      <Star className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      Explore Destinations
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};    