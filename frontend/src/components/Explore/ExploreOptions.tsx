import React, { useState } from 'react';
import { Plane, Building, Utensils, Camera, Star, ShoppingBag, Plus } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { ExternalOption } from '../../types';
import { apiFetch } from '../../api/client';
import { routes } from '../../api/routes';
import { useCart } from '../../context/CartContext';
import { useTrips } from '../../hooks/useTrips';
import { useAuth } from '../../hooks/useAuth';

// Load all external options for a trip from backend
async function fetchOptionsForTrip(tripId: string): Promise<ExternalOption[]> {
  const data = await apiFetch<ExternalOption[]>(routes.external.optionsAll(tripId));
  return Array.isArray(data) ? data : [];
}

interface ExploreOptionsProps {
  onNavigate: (view: string) => void;
}

export const ExploreOptions: React.FC<ExploreOptionsProps> = ({ onNavigate }) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [options, setOptions] = useState<ExternalOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const { user } = useAuth();
  const { addItem, loadCartForTrip } = useCart();
  const { trips } = useTrips();

  const loadOptions = async (tripId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const useTripId = tripId || selectedTripId;
      if (!useTripId) {
        setOptions([]);
        setError('Select a trip to view tailored options.');
        return;
      }
      const data = await fetchOptionsForTrip(useTripId);
      setOptions(data);
    } catch (e: any) {
      if (e?.message?.includes('404') || e?.message?.includes('Cannot GET')) {
        setError('Server is currently busy. Please try again later.');
      } else {
        setError(e?.message || 'Failed to load options');
      }
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // On mount, auto-select first trip if available and load options
  React.useEffect(() => {
    if (trips.length > 0 && !selectedTripId) {
      const first = trips[0]?.id;
      if (first) {
        setSelectedTripId(first);
        loadOptions(first);
      }
    }
  }, [trips, selectedTripId]);

  const types = [
    { id: 'all', label: 'All', icon: Star },
    { id: 'flight', label: 'Flights', icon: Plane },
    { id: 'hotel', label: 'Hotels', icon: Building },
    { id: 'restaurant', label: 'Dining', icon: Utensils },
    { id: 'attraction', label: 'Experiences', icon: Camera },
  ];

  const filteredOptions = options.filter(option =>
    (selectedType === 'all' || option.type === selectedType) &&
    option.price <= priceRange
  );

  const handleAddToCart = async (option: ExternalOption) => {
    if (!selectedTripId) {
      return;
    }

    try {
      await addItem({
        tripId: selectedTripId,
        itineraryItemId: option.id,
        title: option.title,
        description: option.description,
        price: option.price,
        image: option.image,
        quantity: 1,
      }, selectedTripId);

      await loadCartForTrip(selectedTripId);

      alert(`${option.title} added to cart!`);
    } catch (error) {
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const handleTripSelect = (tripId: string) => {
    setSelectedTripId(tripId);
    loadCartForTrip(tripId);
    // Refresh options for the selected trip
    loadOptions(tripId);
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

      <div className="relative z-10 pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <Button onClick={() => onNavigate('home')} variant="ghost" className="text-luxury-700 hover:text-luxury-900">
                ← Back to Home
              </Button>
              {user && (
                <div className="flex space-x-3">
                  <Button onClick={() => onNavigate('create-trip')} variant="secondary" className="bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <Plus className="w-5 h-5" />
                    <span>Create Trip</span>
                  </Button>
                  <Button onClick={() => onNavigate('cart')} variant="secondary" className="text-luxury-800 hover:text-luxury-900 border border-luxury-300 bg-white/60 hover:bg-white/80 transition-colors duration-300">
                    <ShoppingBag className="w-5 h-5" />
                    <span>View Cart</span>
                  </Button>
                </div>
              )}
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-serif font-bold text-luxury-900 mb-4">
                Explore <span className="text-gold-600">Luxury</span>
              </h1>
              <p className="text-xl text-luxury-700">Discover the finest experiences around the world</p>
            </div>
          </div>

          {/* Trip Selector - Only for authenticated users */}
          {user && (
            <div className="mb-8 animate-slide-up">
              <GlassCard className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
                  <div>
                    <h3 className="text-lg font-semibold text-luxury-900 mb-2">Select Trip for Cart</h3>
                    <p className="text-luxury-600 text-sm">
                      {selectedTripId
                        ? `Adding items to: ${trips.find(t => t.id === selectedTripId)?.title || 'Unknown Trip'}`
                        : 'Choose a trip to add items to your cart'
                      }
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    {trips.length > 0 ? (
                      <select
                        value={selectedTripId}
                        onChange={(e) => handleTripSelect(e.target.value)}
                        className="px-4 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-luxury-800"
                      >
                        <option value="">Select a trip...</option>
                        {trips.map(trip => (
                          <option key={trip.id} value={trip.id}>
                            {trip.title} - {trip.destination}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Button onClick={() => onNavigate('create-trip')} variant="secondary">
                        <Plus className="w-5 h-5" />
                        <span>Create Your First Trip</span>
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Filters */}
          <div className="mb-12 animate-slide-up">
            <GlassCard className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
                {/* Type Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-luxury-700 mb-3">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {types.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                          selectedType === type.id
                            ? 'bg-gold-gradient text-white shadow-lg'
                            : 'bg-white/60 text-luxury-700 hover:bg-white/80'
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-luxury-700 mb-3">
                    Max Price: <span className="font-semibold text-luxury-900">₹{priceRange.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-2 bg-luxury-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-gold-gradient [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:shadow-lg"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Options Grid */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-luxury-600 text-lg">Loading luxury options...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-luxury-900 mb-2">Server Busy</h3>
                <p className="text-luxury-600 mb-6">{error}</p>
                <Button
                  onClick={loadOptions}
                  variant="secondary"
                  className="mx-auto"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GlassCard hover className="overflow-hidden group cursor-pointer">
                    <div className="relative h-48">
                      <img
                        src={option.image}
                        alt={option.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                      {/* Rating */}
                      <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                        <Star className="w-4 h-4 text-gold-400 fill-current" />
                        <span className="text-white text-sm font-medium">{option.rating}</span>
                      </div>

                      {/* Price */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-gold-gradient text-white px-4 py-2 rounded-full font-serif font-semibold">
                          ₹{option.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-serif font-semibold text-luxury-900 mb-2 group-hover:text-gold-600 transition-colors duration-300">
                        {option.title}
                      </h3>
                      <p className="text-luxury-700 text-sm mb-4">{option.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {option.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-3 py-1 bg-white/60 text-luxury-700 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => user ? handleAddToCart(option) : onNavigate('login')}
                        disabled={user ? !selectedTripId : false}
                      >
                        {!user ? 'Sign In to Add to Cart' : selectedTripId ? 'Add to Cart' : 'Select Trip First'}
                      </Button>
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