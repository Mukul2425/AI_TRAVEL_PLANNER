import React from 'react';
import { Calendar, Sparkles, Shield, Globe, Headphones } from 'lucide-react';
import { Button } from '../UI/Button';

interface HeroProps {
  onNavigate: (view: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <>
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50">
          {/* Changed opacity to 40 and added a subtle zoom effect for enhancement */}
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-40 scale-105"></div>
        </div>

        {/* Subtle Geometric Elements */}
        <div className="absolute top-32 right-32 w-64 h-64 bg-amber-200/20 rounded-full"></div>
        <div className="absolute bottom-32 left-32 w-48 h-48 bg-amber-300/15 rounded-full"></div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <div className="mb-16">
            <h1 className="text-6xl md:text-8xl font-serif font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              Travel <span className="text-amber-500">Beyond</span>
              <br />
              Luxury
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Plan smarter, travel better with AI
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mb-20">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-md mx-auto">
              <Button 
                size="lg" // Changed to 'lg' for a bigger button
                onClick={() => onNavigate('create-trip')}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 py-5 rounded-2xl font-semibold text-xl transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/25" // Adjusted padding and text size
              >
                <Calendar className="w-6 h-6 mr-2" /> {/* Increased icon size and added margin-right */}
                <span>Plan a Trip</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-amber-500 mb-3">150+</div>
              <div className="text-slate-600 font-medium">Luxury Destinations</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-amber-500 mb-3">50K+</div>
              <div className="text-slate-600 font-medium">Elite Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-amber-500 mb-3">99%</div>
              <div className="text-slate-600 font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
              AI-Powered <span className="text-amber-500">Excellence</span>
            </h2>
            <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto">
              Experience the future of luxury travel planning with our intelligent concierge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-xl group-hover:shadow-amber-500/40 transition-all duration-300">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">AI Trip Planning</h3>
              <p className="text-slate-600 leading-relaxed">
                Intelligent recommendations tailored to your preferences and travel style
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-500/25 group-hover:shadow-xl group-hover:shadow-slate-500/40 transition-all duration-300">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">Luxury Curation</h3>
              <p className="text-slate-600 leading-relaxed">
                Hand-picked premium experiences from our network of elite partners
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">Global Network</h3>
              <p className="text-slate-600 leading-relaxed">
                Access to exclusive venues and experiences in 150+ destinations worldwide
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-xl group-hover:shadow-emerald-500/40 transition-all duration-300">
                <Headphones className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">24/7 Concierge</h3>
              <p className="text-slate-600 leading-relaxed">
                Round-the-clock support from our team of luxury travel specialists
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};