import React from 'react';
import { Crown, ShoppingBag, User, Settings, LogOut, Plane } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();
  const { count } = useCart();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-luxury-300/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 bg-gold-gradient rounded-full flex items-center justify-center group-hover:animate-glow transition-all duration-300">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-luxury-900">Luxe Voyager</h1>
              <p className="text-xs text-gold-600 -mt-1">Travel Beyond Luxury</p>
            </div>
          </div>

          {/* Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`text-sm font-medium transition-colors duration-300 ${
                  currentView === 'dashboard' ? 'text-gold-600' : 'text-luxury-700 hover:text-luxury-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('trips')}
                className={`text-sm font-medium transition-colors duration-300 ${
                  currentView === 'trips' ? 'text-gold-600' : 'text-luxury-700 hover:text-luxury-900'
                }`}
              >
                My Trips
              </button>
              <button
                onClick={() => onNavigate('create-trip')}
                className={`text-sm font-medium transition-colors duration-300 ${
                  currentView === 'create-trip' ? 'text-gold-600' : 'text-luxury-700 hover:text-luxury-900'
                }`}
              >
                Plan Trip
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className={`text-sm font-medium transition-colors duration-300 ${
                  currentView === 'explore' ? 'text-gold-600' : 'text-luxury-700 hover:text-luxury-900'
                }`}
              >
                Explore
              </button>
            </div>
          )}

          {/* User Actions */}
          {user ? (
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <button
                onClick={() => onNavigate('cart')}
                className="relative p-2 text-luxury-700 hover:text-luxury-900 transition-colors duration-300"
              >
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>

              {/* Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gold-gradient rounded-full flex items-center justify-center relative">
                  <User className="w-4 h-4 text-white" />
                  {user.isPremium && (
                    <Crown className="w-3 h-3 text-gold-400 absolute -top-1 -right-1" />
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-luxury-900">{user.name}</p>
                  <p className="text-xs text-gold-600">{user.goldenMiles.toLocaleString()} Golden Miles</p>
                </div>
              </div>

              {/* Settings */}
              <button
                onClick={() => onNavigate('profile')}
                className="p-2 text-luxury-700 hover:text-luxury-900 transition-colors duration-300"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-luxury-700 hover:text-red-500 transition-colors duration-300"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('login')}
                className="text-luxury-700 hover:text-luxury-900 font-medium transition-colors duration-300"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="bg-gold-gradient text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300"
              >
                Join Now
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};