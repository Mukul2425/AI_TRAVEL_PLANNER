import React, { useState, useEffect } from 'react';
import { Crown, MapPin, Calendar, Star, Trophy, Settings, Heart } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTrips } from '../../hooks/useTrips';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';

interface ProfileProps {
  onNavigate: (view: string) => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  goldenMiles: number;
  memberSince: string;
  achievements: Achievement[];
  favoriteDestinations: FavoriteDestination[];
  stats: UserStats;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

interface FavoriteDestination {
  name: string;
  image: string;
  visits: number;
  rating: number;
  lastVisit?: string;
}

interface UserStats {
  completedTrips: number;
  countriesVisited: number;
  totalSpent: number;
  averageRating: number;
  totalMiles: number;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { trips } = useTrips();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      // Build profile locally without API
      const parseAmount = (raw: unknown): number => {
        if (typeof raw === 'number' && isFinite(raw)) return raw;
        if (typeof raw === 'string') {
          const nums = raw.replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
          if (nums && nums.length > 0) {
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
      const getTripCost = (t: any): number => {
        const fromBudget = parseAmount(t?.budget);
        if (fromBudget > 0) return fromBudget;
        const summary = t?.summary;
        if (summary && typeof summary.totalEstimatedCost !== 'undefined') {
          const fromSummary = parseAmount(summary.totalEstimatedCost);
          if (fromSummary > 0) return fromSummary;
        }
        return 0;
      };

      setProfile({
        id: user.id,
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        goldenMiles: user.goldenMiles,
        memberSince: user.memberSince,
        achievements: [],
        favoriteDestinations: [],
        stats: {
          completedTrips: trips.filter(t => t.status === 'past').length,
          countriesVisited: 0,
          totalSpent: trips
            .filter(t => t.status === 'finalized')
            .reduce((sum, t) => sum + getTripCost(t), 0),
          averageRating: 4.8,
          totalMiles: user.goldenMiles
        }
      });

      setLoading(false);
    };

    loadProfile();
  }, [user?.id, trips]);

  const handleSaveProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;
    // Save locally (no API available)
    setProfile(prev => prev ? { ...prev, ...updates } as UserProfile : prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background from Dashboard UI */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-amber-300/20 rounded-full animate-float blur-sm"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/25 to-blue-300/15 rounded-full animate-float-delayed blur-sm"></div>
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-gradient-to-br from-emerald-200/20 to-emerald-300/10 rounded-full animate-pulse-slow blur-sm"></div>
          <div className="absolute top-32 left-1/2 w-32 h-32 bg-gradient-to-br from-rose-200/25 to-rose-300/15 rounded-full animate-bounce-slow blur-sm"></div>
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-luxury-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        </div>
        <div className="relative z-10 pt-24 px-6 min-h-screen flex items-center justify-center">
          <GlassCard className="p-8 text-center max-w-md">
            <h2 className="text-2xl font-serif font-semibold text-luxury-900 mb-4">Failed to load profile</h2>
            <p className="text-luxury-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'settings', label: 'Settings' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-12">
            {/* Profile Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <GlassCard className="p-6 text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="text-3xl font-serif font-bold text-gold-600 mb-2">{profile.stats.completedTrips}</div>
                <div className="text-luxury-600 text-sm">Trips Completed</div>
              </GlassCard>
              <GlassCard className="p-6 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl font-serif font-bold text-gold-600 mb-2">{profile.stats.countriesVisited}</div>
                <div className="text-luxury-600 text-sm">Countries Visited</div>
              </GlassCard>
              <GlassCard className="p-6 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl font-serif font-bold text-gold-600 mb-2">{profile.stats.totalMiles.toLocaleString()}</div>
                <div className="text-luxury-600 text-sm">Golden Miles</div>
              </GlassCard>
              <GlassCard className="p-6 text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <span className="text-3xl font-serif font-bold text-gold-600">{profile.stats.averageRating}</span>
                  <Star className="w-6 h-6 text-gold-400 fill-current" />
                </div>
                <div className="text-luxury-600 text-sm">Avg Experience Rating</div>
              </GlassCard>
            </div>

            {/* Recent Activity Timeline */}
            <GlassCard className="p-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-2xl font-serif font-semibold text-luxury-900 mb-6 flex items-center space-x-2">
                <Calendar className="w-6 h-6 text-gold-600" />
                <span>Recent Activity</span>
              </h3>
              <div className="space-y-6">
                {trips.slice(0, 3).map((trip, index) => (
                  <div key={trip.id} className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      trip.status === 'past' ? 'bg-gold-600' :
                      trip.status === 'upcoming' ? 'bg-blue-600' : 'bg-luxury-600'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-luxury-900 font-medium">
                        {trip.status === 'past' ? 'Completed' : trip.status === 'upcoming' ? 'Booked' : 'Planned'} {trip.title}
                      </p>
                      <p className="text-luxury-600 text-sm">{trip.startDate}</p>
                    </div>
                    <div className={`w-5 h-5 ${
                      trip.status === 'past' ? 'text-gold-600' :
                      trip.status === 'upcoming' ? 'text-blue-600' : 'text-luxury-600'
                    }`}>
                      {trip.status === 'past' ? <Star className="w-5 h-5" /> :
                       trip.status === 'upcoming' ? <Calendar className="w-5 h-5" /> :
                       <Trophy className="w-5 h-5" />}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {profile.achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GlassCard className={`p-6 ${achievement.earned ? 'border-gold-400/30' : 'opacity-60'}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        achievement.earned
                          ? 'bg-gold-gradient'
                          : 'bg-white/60 border border-luxury-300'
                      }`}>
                        <Trophy className={`w-8 h-8 ${
                          achievement.earned ? 'text-white' : 'text-luxury-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-serif font-semibold mb-1 ${
                          achievement.earned ? 'text-luxury-900' : 'text-luxury-600'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className="text-luxury-700 text-sm">{achievement.description}</p>
                        {achievement.earnedAt && (
                          <p className="text-gold-600 text-xs mt-1">Earned {achievement.earnedAt}</p>
                        )}
                      </div>
                      {achievement.earned && (
                        <Trophy className="w-6 h-6 text-gold-400" />
                      )}
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        );

      case 'favorites':
        return (
          <div className="space-y-10">
            <GlassCard className="p-8">
              <h3 className="text-2xl font-serif font-semibold text-luxury-900 mb-6 flex items-center space-x-2">
                <Heart className="w-6 h-6 text-gold-600" />
                <span>Favorite Destinations</span>
              </h3>
              {profile.favoriteDestinations.length === 0 ? (
                <div className="text-center text-luxury-600 py-8">
                  No favorite destinations yet. Start exploring to build your list!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {profile.favoriteDestinations.map((destination, index) => (
                    <div
                      key={destination.name}
                      className="animate-fade-in group cursor-pointer"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                        <img
                          src={destination.image}
                          alt={destination.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        {/* Visit Count */}
                        <div className="absolute top-4 right-4 bg-gold-gradient text-white px-3 py-1 rounded-full text-sm font-medium">
                          {destination.visits} visits
                        </div>

                        {/* Rating */}
                        <div className="absolute bottom-4 left-4 flex items-center space-x-1">
                          {[...Array(destination.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-gold-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-lg font-serif font-semibold text-luxury-900 group-hover:text-gold-600 transition-colors duration-300">
                        {destination.name}
                      </h4>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-8">
            <GlassCard className="p-8">
              <h3 className="text-2xl font-serif font-semibold text-luxury-900 mb-6 flex items-center space-x-2">
                <Settings className="w-6 h-6 text-gold-600" />
                <span>Account Settings</span>
              </h3>
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-luxury-700 mb-3">Full Name</label>
                  <input
                    type="text"
                    defaultValue={profile.name}
                    onChange={(e) => handleSaveProfile({ name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/80 border border-luxury-300 rounded-xl text-luxury-900 placeholder-luxury-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-luxury-700 mb-3">Email</label>
                  <input
                    type="email"
                    defaultValue={profile.email}
                    onChange={(e) => handleSaveProfile({ email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/80 border border-luxury-300 rounded-xl text-luxury-900 placeholder-luxury-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-luxury-900 font-medium mb-1">Notifications</h4>
                    <p className="text-luxury-600 text-sm">Receive updates about your trips</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only" />
                    <div className="w-12 h-6 bg-gold-gradient rounded-full cursor-pointer"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="text-luxury-900 font-medium mb-1">Marketing Emails</h4>
                    <p className="text-luxury-600 text-sm">Exclusive offers and destination updates</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="sr-only" />
                    <div className="w-12 h-6 bg-luxury-300 rounded-full cursor-pointer"></div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button className="w-full md:w-auto bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" onClick={() => handleSaveProfile(profile)}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background from Dashboard UI */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-15"></div>
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-amber-300/20 rounded-full animate-float blur-sm"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-gradient-to-br from-blue-200/25 to-blue-300/15 rounded-full animate-float-delayed blur-sm"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-gradient-to-br from-emerald-200/20 to-emerald-300/10 rounded-full animate-pulse-slow blur-sm"></div>
        <div className="absolute top-32 left-1/2 w-32 h-32 bg-gradient-to-br from-rose-200/25 to-rose-300/15 rounded-full animate-bounce-slow blur-sm"></div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative z-10 pt-24 px-4 sm:px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-8 animate-fade-in">
            <Button onClick={() => onNavigate('dashboard')} variant="ghost" className="text-luxury-700 hover:text-luxury-900">
              ← Back to Dashboard
            </Button>
          </div>

          {/* Profile Header */}
          <div className="mb-16 animate-fade-in">
            <GlassCard className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gold-gradient rounded-full flex items-center justify-center relative shadow-lg shadow-gold-400/30">
                    <span className="text-4xl font-serif font-bold text-white">
                      {profile.name?.charAt(0).toUpperCase()}
                    </span>
                    {profile.isPremium && (
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-gold-gradient rounded-full flex items-center justify-center animate-glow shadow-xl shadow-gold-400/50">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                    <h1 className="text-4xl font-serif font-bold text-luxury-900">{profile.name}</h1>
                    {profile.isPremium && (
                      <span className="bg-gold-gradient text-white px-3 py-1 rounded-full text-sm font-medium">
                        Premium Elite
                      </span>
                    )}
                  </div>
                  <p className="text-luxury-700 text-lg mb-4">{profile.email}</p>
                  <p className="text-luxury-600 mb-6">Member since {profile.memberSince}</p>

                  <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
                    <div className="text-center">
                      <div className="text-2xl font-serif font-bold text-gold-600">{profile.stats.totalMiles.toLocaleString()}</div>
                      <div className="text-luxury-600 text-sm">Golden Miles</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-serif font-bold text-gold-600">₹{profile.stats.totalSpent.toLocaleString()}</div>
                      <div className="text-luxury-600 text-sm">Total Invested</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-2xl font-serif font-bold text-gold-600">{profile.stats.averageRating}</span>
                        <Star className="w-5 h-5 text-gold-400 fill-current" />
                      </div>
                      <div className="text-luxury-600 text-sm">Avg Experience Rating</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-12 animate-slide-up">
            <div className="flex flex-wrap justify-center space-x-1 bg-white/60 backdrop-blur-md rounded-2xl p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gold-gradient text-white shadow-lg'
                      : 'text-luxury-700 hover:text-luxury-900 hover:bg-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in pb-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};