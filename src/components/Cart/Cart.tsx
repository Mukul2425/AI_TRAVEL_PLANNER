import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, CreditCard, MapPin, Calendar } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useCart } from '../../context/CartContext';
import { useTrips } from '../../hooks/useTrips';

interface CartProps {
  onNavigate: (view: string) => void;
}

export const Cart: React.FC<CartProps> = ({ onNavigate }) => {
  const { items: cartItems, updateItemQuantity, removeItem, clear, total } = useCart();
  const { trips } = useTrips();
  const [selectedTripId, setSelectedTripId] = useState<string>('');

  const currentTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  useEffect(() => {
    if (currentTrip && !selectedTripId) {
      setSelectedTripId(currentTrip.id);
    }
  }, [currentTrip, selectedTripId]);

  const handleClearCart = () => {
    if (selectedTripId) {
      clear(selectedTripId);
    } else {
      clear();
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (selectedTripId) {
      updateItemQuantity(itemId, quantity, selectedTripId);
    } else {
      updateItemQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (selectedTripId) {
      removeItem(itemId, selectedTripId);
    } else {
      removeItem(itemId);
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

      <div className="relative z-10 pt-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <Button onClick={() => onNavigate('explore')} variant="ghost" className="text-luxury-700 hover:text-luxury-900">
                ← Continue Shopping
              </Button>
              <Button onClick={() => onNavigate('dashboard')} variant="ghost" className="text-luxury-700 hover:text-luxury-900">
                Dashboard
              </Button>
            </div>
            <div className="text-center">
              <h1 className="text-5xl font-serif font-bold text-luxury-900 mb-4">
                Your <span className="text-gold-600">Luxury Cart</span>
              </h1>
              <p className="text-xl text-luxury-700">Review your selected experiences</p>
            </div>
          </div>

          {/* Trip Selector */}
          {trips.length > 0 && (
            <div className="mb-8 animate-slide-up">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-luxury-900 mb-2">Cart for Trip</h3>
                    <p className="text-luxury-600 text-sm">
                      {currentTrip ? `Viewing cart items for: ${currentTrip.title}` : 'Select a trip to view its cart'}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className="px-4 py-2 bg-white/80 border border-luxury-300 rounded-lg focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-luxury-800"
                    >
                      {trips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.title} - {trip.destination}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-8 bg-white/60 rounded-full flex items-center justify-center border-2 border-dashed border-luxury-400/50">
                <ShoppingBag className="w-12 h-12 text-luxury-500" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-luxury-900 mb-4">Your cart is empty</h3>
              <p className="text-luxury-600 mb-8">
                {currentTrip
                  ? `No items in cart for ${currentTrip.title}`
                  : 'Start adding luxury experiences to your journey'
                }
              </p>
              <Button onClick={() => onNavigate('explore')} size="lg" className="bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Explore Experiences
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                {cartItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <GlassCard className="p-6">
                      <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border border-luxury-300/50">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-serif font-semibold text-luxury-900 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-luxury-700 text-sm mb-3">{item.description}</p>
                          <div className="text-gold-600 font-semibold">
                            ₹{item.price.toLocaleString()} per person
                          </div>
                          {currentTrip && (
                            <div className="flex items-center space-x-4 mt-2 text-sm text-luxury-600">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-luxury-500" />
                                <span>{currentTrip.destination}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-luxury-500" />
                                <span>{currentTrip.startDate}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="w-8 h-8 bg-white/60 hover:bg-white/80 rounded-full flex items-center justify-center text-luxury-700 hover:text-luxury-900 transition-all duration-300"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-luxury-900 font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-white/60 hover:bg-white/80 rounded-full flex items-center justify-center text-luxury-700 hover:text-luxury-900 transition-all duration-300"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 rounded-full flex items-center justify-center text-red-500 hover:text-red-600 transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="animate-fade-in lg:col-span-1" style={{ animationDelay: '0.3s' }}>
                <GlassCard className="p-6 sticky top-32">
                  <h3 className="text-xl font-serif font-semibold text-luxury-900 mb-6">Order Summary</h3>

                  {currentTrip && (
                    <div className="mb-4 p-3 bg-luxury-50 rounded-lg">
                      <h4 className="font-medium text-luxury-900 flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-luxury-600" />
                        <span>{currentTrip.destination}</span>
                      </h4>
                      <p className="text-sm text-luxury-600">{currentTrip.title}</p>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-luxury-700">{item.title} × {item.quantity}</span>
                        <span className="text-luxury-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-luxury-300 pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-luxury-900">Total</span>
                      <span className="text-2xl font-serif font-bold text-gold-600">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button size="lg" className="w-full mb-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <CreditCard className="w-5 h-5 mr-2" />
                    <span>Proceed to Checkout</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full mb-2 bg-white/60 text-luxury-800 hover:bg-white/80 hover:text-luxury-900 transition-colors duration-300"
                    onClick={handleClearCart}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cart
                  </Button>
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};