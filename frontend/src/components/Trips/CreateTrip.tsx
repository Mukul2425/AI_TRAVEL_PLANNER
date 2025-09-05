import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, DollarSign, ArrowRight, ArrowLeft, Star, X, Sparkles } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { useTrips } from '../../hooks/useTrips';
import { Trip } from '../../types';

interface CreateTripProps {
  onNavigate: (view: string) => void;
}

const steps = [
  { id: 1, title: 'Destination', description: 'Where would you like to go?', icon: MapPin },
  { id: 2, title: 'Dates', description: 'When are you traveling?', icon: Calendar },
  { id: 3, title: 'Details', description: 'Tell us about your trip', icon: Users },
  { id: 4, title: 'Budget', description: 'What\'s your investment range?', icon: DollarSign },
];

export const CreateTrip: React.FC<CreateTripProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    originStation: '',
    startDate: '',
    endDate: '',
    participants: 1,
    budget: 5000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { createTrip } = useTrips();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!formData.title || !formData.destination || !formData.originStation) {
        setError('Please fill in all fields before proceeding');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) {
        setError('Please select both start and end dates');
        return;
      }
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('End date must be after start date');
        return;
      }
    }
    
    setError(null); // Clear any previous errors
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setError(null); // Clear any errors when going back
      setCurrentStep(currentStep - 1);
    }
  };

  const validateForm = () => {
    const requiredFields = ['title', 'destination', 'originStation', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate dates
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate form before submission
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }
      
      const tripData: Omit<Trip, 'id' | 'createdAt'> = {
        ...formData,
        image: 'https://images.pexels.com/photos/2549018/pexels-photo-2549018.jpeg?auto=compress&cs=tinysrgb&w=800',
        status: 'draft',
        itinerary: [],
      };

      await createTrip(tripData);
      onNavigate('trips');
    } catch (err: any) {
      setError(err?.message || 'Failed to create trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={`space-y-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="animate-fade-in-up delay-300">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-4 flex items-center">
                <Sparkles className="w-6 h-6 mr-3 text-amber-500" />
                Trip Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-6 py-5 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all duration-500 text-lg font-medium shadow-lg hover:shadow-xl hover:bg-white"
                placeholder="My Amazing Adventure"
              />
            </div>
            <div className="animate-fade-in-up delay-500">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-4 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-amber-500" />
                Origin Station
              </label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-amber-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                <input
                  type="text"
                  value={formData.originStation}
                  onChange={(e) => setFormData({ ...formData, originStation: e.target.value })}
                  className="w-full pl-16 pr-6 py-5 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all duration-500 text-lg font-medium shadow-lg hover:shadow-xl hover:bg-white"
                  placeholder="New York, USA"
                />
              </div>
            </div>
            <div className="animate-fade-in-up delay-700">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-4 flex items-center">
                <MapPin className="w-6 h-6 mr-3 text-amber-500" />
                Destination
              </label>
              <div className="relative group">
                <MapPin className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-amber-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full pl-16 pr-6 py-5 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-500 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all duration-500 text-lg font-medium shadow-lg hover:shadow-xl hover:bg-white"
                  placeholder="Paris, France"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={`space-y-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="animate-fade-in-up delay-300">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-amber-500" />
                Start Date
              </label>
              <div className="relative group">
                <Calendar className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-amber-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full pl-16 pr-6 py-5 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all duration-500 text-lg font-medium shadow-lg hover:shadow-xl hover:bg-white"
                />
              </div>
            </div>
            <div className="animate-fade-in-up delay-500">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-amber-500" />
                End Date
              </label>
              <div className="relative group">
                <Calendar className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-amber-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full pl-16 pr-6 py-5 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all duration-500 text-lg font-medium shadow-lg hover:shadow-xl hover:bg-white"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={`space-y-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="animate-fade-in-up delay-300">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-4 flex items-center">
                <Users className="w-6 h-6 mr-3 text-amber-500" />
                Number of Travelers
              </label>
              <div className="relative group">
                <Users className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-amber-400 group-focus-within:text-amber-500 transition-colors duration-300" />
                <select
                  value={formData.participants}
                  onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) })}
                  className="w-full pl-16 pr-6 py-5 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-2xl text-slate-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all duration-500 text-lg font-medium appearance-none shadow-lg hover:shadow-xl hover:bg-white cursor-pointer"
                >
                  <option value={1}>1 Traveler</option>
                  <option value={2}>2 Travelers</option>
                  <option value={3}>3 Travelers</option>
                  <option value={4}>4 Travelers</option>
                  <option value={5}>5+ Travelers</option>
                </select>
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={`space-y-8 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="animate-fade-in-up delay-300">
              <label className="block text-xl font-serif font-semibold text-slate-900 mb-6 flex items-center">
                <DollarSign className="w-6 h-6 mr-3 text-amber-500" />
                Budget Range: <span className="text-amber-500 ml-2">₹{formData.budget.toLocaleString()}</span>
              </label>
              <div className="relative group">
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                  className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full appearance-none cursor-pointer slider group-hover:from-amber-200 group-hover:to-amber-300 transition-all duration-500"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((formData.budget - 1000) / (50000 - 1000)) * 100}%, #e2e8f0 ${((formData.budget - 1000) / (50000 - 1000)) * 100}%, #e2e8f0 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-slate-600 mt-4 font-medium">
                <span className="bg-white/80 px-3 py-1 rounded-full">₹1,000</span>
                <span className="bg-white/80 px-3 py-1 rounded-full">₹50,000+</span>
              </div>
              
              {/* Budget Categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { range: '1K-5K', label: 'Essential', color: 'from-blue-400 to-blue-600' },
                  { range: '5K-15K', label: 'Premium', color: 'from-emerald-400 to-emerald-600' },
                  { range: '15K-30K', label: 'Luxury', color: 'from-amber-400 to-amber-600' },
                  { range: '30K+', label: 'Ultra-Luxury', color: 'from-purple-400 to-purple-600' }
                ].map((category) => (
                  <div key={category.range} className={`text-center p-4 rounded-xl bg-gradient-to-br ${category.color} text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default`}>
                    <div className="font-bold text-lg">{category.range}</div>
                    <div className="text-sm opacity-90">{category.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className={`text-center mb-16 transition-all duration-1500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex items-center justify-center mb-8">
              <button 
                onClick={() => onNavigate('dashboard')} 
                className="group flex items-center text-slate-600 hover:text-amber-600 transition-all duration-300 hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            <h1 className="text-6xl md:text-7xl font-serif font-bold text-slate-900 mb-6 leading-tight">
              Plan Your <span className="text-amber-500 animate-gradient bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent bg-300%">Journey</span>
            </h1>
            <p className="text-2xl text-slate-600 font-light leading-relaxed">Let's create something extraordinary together</p>
          </div>

          {/* Enhanced Progress Bar */}
          <div className={`mb-16 transition-all duration-1500 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex items-center justify-between mb-8 relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 rounded-full transform -translate-y-1/2 z-0">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-500 shadow-lg ${
                      currentStep >= step.id 
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30 scale-110' 
                        : 'bg-white text-slate-400 shadow-slate-200'
                    } hover:scale-125 cursor-pointer`}>
                      <StepIcon className={`w-7 h-7 ${currentStep >= step.id ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="mt-4 text-center">
                      <div className={`font-serif font-semibold transition-colors duration-300 ${
                        currentStep >= step.id ? 'text-slate-900' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-sm mt-1 transition-colors duration-300 ${
                        currentStep >= step.id ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        Step {step.id}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center">
              <h2 className="text-4xl font-serif font-bold text-slate-900 mb-3">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-xl text-slate-600 font-light">{steps[currentStep - 1].description}</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 p-6 bg-red-50/90 backdrop-blur-sm border-2 border-red-200 rounded-2xl text-red-700 shadow-lg animate-fade-in-up">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <X className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Enhanced Form Content */}
          <div className={`mb-12 transition-all duration-1500 delay-500 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <GlassCard className="p-12 relative overflow-hidden group">
              {/* Subtle hover effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                {renderStepContent()}
              </div>
            </GlassCard>
          </div>

          {/* Enhanced Navigation */}
          <div className={`flex justify-between items-center mb-16 transition-all duration-1500 delay-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`group flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                currentStep === 1 
                  ? 'invisible' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-lg hover:scale-105'
              }`}
            >
              <ArrowLeft className="w-6 h-6 mr-3 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Previous</span>
            </button>

            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white px-12 py-6 rounded-2xl font-semibold text-xl transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transform active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Animated background overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                
                {/* Button content */}
                <div className="relative flex items-center justify-center">
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span className="group-hover:text-white transition-colors duration-300">Create Trip</span>
                      <Star className="w-7 h-7 ml-3 group-hover:rotate-12 group-hover:text-yellow-200 transition-all duration-300" />
                    </>
                  )}
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10"></div>
                </div>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="group relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-amber-600 hover:via-amber-500 hover:to-amber-600 text-white px-12 py-6 rounded-2xl font-semibold text-xl transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transform active:scale-95 overflow-hidden"
              >
                {/* Animated background overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                
                {/* Button content */}
                <div className="relative flex items-center justify-center">
                  <span className="group-hover:text-white transition-colors duration-300">Next</span>
                  <ArrowRight className="w-7 h-7 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10"></div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};