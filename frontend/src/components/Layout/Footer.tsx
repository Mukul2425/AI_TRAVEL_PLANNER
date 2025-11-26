import React from 'react';
import { Plane, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-luxury-900 via-luxury-800 to-luxury-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gold-gradient rounded-full flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold">Wanderlove</h3>
                <p className="text-gold-400 text-sm">Travel Beyond Luxury</p>
              </div>
            </div>
            <p className="text-luxury-300 mb-6 leading-relaxed">
              Experience the pinnacle of luxury travel with our AI-powered concierge service. 
              We curate extraordinary journeys that redefine what it means to travel in style.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-luxury-700 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-luxury-700 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-luxury-700 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-luxury-700 hover:bg-gold-500 rounded-full flex items-center justify-center transition-colors duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-gold-400">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Destinations
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Luxury Hotels
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Private Jets
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Concierge Services
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Travel Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-gold-400">Services</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Trip Planning
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Luxury Accommodations
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Private Transportation
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Exclusive Experiences
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  24/7 Support
                </a>
              </li>
              <li>
                <a href="#" className="text-luxury-300 hover:text-gold-400 transition-colors duration-300">
                  Travel Insurance
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-gold-400">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-luxury-300">
                    123 Luxury Avenue<br />
                    Beverly Hills, CA 90210<br />
                    United States
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <p className="text-luxury-300">+1 (555) 123-LUXE</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <p className="text-luxury-300">concierge@wanderlove.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-luxury-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-luxury-400 text-sm mb-4 md:mb-0">
              © 2024 Wanderlove. All rights reserved. | 
              <a href="#" className="hover:text-gold-400 transition-colors duration-300 ml-1">Privacy Policy</a> | 
              <a href="#" className="hover:text-gold-400 transition-colors duration-300 ml-1">Terms of Service</a>
            </div>
            <div className="flex items-center space-x-6 text-sm text-luxury-400">
              <span>Trusted by 50,000+ luxury travelers</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse"></div>
                <span>24/7 Concierge Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
