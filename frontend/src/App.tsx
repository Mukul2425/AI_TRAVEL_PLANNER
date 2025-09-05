import { useState } from 'react';
import { Navbar } from './components/Layout/Navbar';
import { Footer } from './components/Layout/Footer';
import { Hero } from './components/Home/Hero';
import { FeaturedTrips } from './components/Home/FeaturedTrips';
import { Partners } from './components/Home/Partners';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TripsList } from './components/Trips/TripsList';
import { CreateTrip } from './components/Trips/CreateTrip';
import { EditTrip } from './components/Trips/EditTrip';
import { TripDetails } from './components/Trips/TripDetails';
import { ItineraryManager } from './components/Trips/ItineraryManager'; // Make sure this component exists
import { PlanWithAI } from './components/Trips/PlanWithAI';
import { ViewItinerary } from './components/Trips/ViewItinerary';
import { ExploreOptions } from './components/Explore/ExploreOptions';
import { Cart } from './components/Cart/Cart';
import { Profile } from './components/Profile/Profile';
import { useAuth } from './hooks/useAuth';
import { CartProvider } from './context/CartContext';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const { user, isLoading } = useAuth();

  // Updated navigation handler to accept both view and optional tripId
  const handleNavigate = (view: string, tripId?: string) => {
    
    setCurrentView(view);
    
    // Set trip ID if provided
    if (tripId) {
      setCurrentTripId(tripId);
    } else if (!['trip-details', 'edit-trip', 'itinerary'].includes(view)) {
      // Clear trip ID for views that don't need it
      setCurrentTripId(null);
    }
  };

  // Legacy navigation handler for components that still use string-based navigation
  const handleLegacyNavigate = (navigationString: string) => {
    
    // Parse different navigation patterns
    if (navigationString.startsWith('trip-details-')) {
      const tripId = navigationString.replace('trip-details-', '');
      handleNavigate('trip-details', tripId);
    } else if (navigationString.startsWith('edit-trip-')) {
      const tripId = navigationString.replace('edit-trip-', '');
      handleNavigate('edit-trip', tripId);
    } else if (navigationString.startsWith('itinerary-')) {
      const tripId = navigationString.replace('itinerary-', '');
      handleNavigate('itinerary', tripId);
    } else if (navigationString.startsWith('trip-')) {
      // Handle legacy trip- pattern
      const tripId = navigationString.replace('trip-', '');
      handleNavigate('trip-details', tripId);
    } else {
      // Handle simple navigation
      handleNavigate(navigationString);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-luxury-200 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderContent = () => {
    // Only redirect to login for specific protected routes that require authentication
    const authRequiredRoutes = ['dashboard', 'trips', 'create-trip', 'edit-trip', 'trip-details', 'itinerary', 'plan-with-ai', 'view-itinerary', 'cart', 'profile'];
    if (!user && authRequiredRoutes.includes(currentView)) {
      return <LoginForm onNavigate={handleNavigate} />;
    }

    switch (currentView) {
      case 'home':
        return (
          <div>
            <Hero onNavigate={handleLegacyNavigate} />
            <FeaturedTrips />
            <Partners />
          </div>
        );
        
      case 'login':
        return <LoginForm onNavigate={handleNavigate} />;
        
      case 'signup':
        return <SignupForm onNavigate={handleNavigate} />;
        
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
        
      case 'trips':
        return <TripsList onNavigate={handleNavigate} />;
        
      case 'create-trip':
        return <CreateTrip onNavigate={handleNavigate} />;
        
      case 'edit-trip':
        if (!currentTripId) {
          // If no trip ID, redirect to trips list
          setCurrentView('trips');
          setCurrentTripId(null);
          return <TripsList onNavigate={handleNavigate} />;
        }
        return <EditTrip tripId={currentTripId} onNavigate={handleNavigate} />;
        
      case 'trip-details':
        if (!currentTripId) {
          // If no trip ID, redirect to trips list
          setCurrentView('trips');
          setCurrentTripId(null);
          return <TripsList onNavigate={handleNavigate} />;
        }
        return <TripDetails tripId={currentTripId} onNavigate={handleNavigate} />;
        
      case 'itinerary':
        if (!currentTripId) {
          // If no trip ID, redirect to trips list
          setCurrentView('trips');
          setCurrentTripId(null);
          return <TripsList onNavigate={handleNavigate} />;
        }
        // Make sure your ItineraryManager component exists and accepts these props
        return <ItineraryManager tripId={currentTripId} onNavigate={handleNavigate} />;
        
      case 'plan-with-ai':
        if (!currentTripId) {
          // If no trip ID, redirect to trips list
          setCurrentView('trips');
          setCurrentTripId(null);
          return <TripsList onNavigate={handleNavigate} />;
        }
        return <PlanWithAI tripId={currentTripId} onNavigate={handleNavigate} />;
        
      case 'view-itinerary':
        if (!currentTripId) {
          // If no trip ID, redirect to trips list
          setCurrentView('trips');
          setCurrentTripId(null);
          return <TripsList onNavigate={handleNavigate} />;
        }
        return <ViewItinerary tripId={currentTripId} onNavigate={handleNavigate} />;
        
      case 'explore':
        return <ExploreOptions onNavigate={handleNavigate} />;
        
      case 'cart':
        return <Cart onNavigate={handleNavigate} />;
        
      case 'profile':
        return <Profile onNavigate={handleNavigate} />;
        
      default:
        return (
          <div>
            <Hero onNavigate={handleLegacyNavigate} />
            <FeaturedTrips />
            <Partners />
          </div>
        );
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-luxury-200 flex flex-col">
        <Navbar currentView={currentView} onNavigate={handleLegacyNavigate} />
        <div className="pt-20 flex-1">
          {renderContent()}
        </div>
        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;