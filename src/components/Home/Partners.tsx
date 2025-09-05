import React from 'react';
import { Plane, Building, Utensils, Camera } from 'lucide-react';

// Removed dummy partners list

export const Partners: React.FC = () => {
  return (
    <section className="py-20 px-6 border-t border-luxury-300/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold text-luxury-900 mb-4">
            Exclusive <span className="text-gold-600">Partners</span>
          </h2>
          <p className="text-lg text-luxury-700">
            Collaborating with the world's finest luxury brands
          </p>
        </div>

        <div className="text-center text-luxury-600">Partner list coming soon.</div>
      </div>
    </section>
  );
};