import React from 'react';
import { Star, MapPin, Calendar } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';

// Removed dummy featured trips data

export const FeaturedTrips: React.FC = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-serif font-bold text-luxury-900 mb-4">
            Featured <span className="text-gold-600">Experiences</span>
          </h2>
          <p className="text-xl text-luxury-700 max-w-2xl mx-auto">
            Handpicked luxury experiences crafted for the discerning traveler
          </p>
        </div>

        <div className="text-center text-luxury-600">No featured trips to display.</div>
      </div>
    </section>
  );
};