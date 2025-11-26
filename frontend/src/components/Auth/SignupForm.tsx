import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useAuth } from '../../hooks/useAuth';

interface SignupFormProps {
  onNavigate: (view: string) => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-])[A-Za-z\d@$!%*?&#^()_\-]{8,}$/;

    if (!trimmedName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (trimmedName.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!strongPasswordRegex.test(password)) {
      setError(
        'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character'
      );
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      await signup(trimmedName, email.trim(), password, confirmPassword);
      onNavigate('dashboard');
    } catch (err: any) {
      const message = err?.message || 'Failed to create account';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-primary-50 via-primary-100 to-luxury-200 pt-20">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-30"></div>
      <div className="absolute inset-0 bg-white/40"></div>
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-luxury-900 mb-2">Join the Elite</h1>
          <p className="text-luxury-700">Create your luxury travel account</p>
        </div>

        <GlassCard className="p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-luxury-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-luxury-300 rounded-xl text-luxury-900 placeholder-luxury-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-luxury-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-luxury-300 rounded-xl text-luxury-900 placeholder-luxury-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-luxury-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/80 border border-luxury-300 rounded-xl text-luxury-900 placeholder-luxury-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-luxury-500 hover:text-luxury-700 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-luxury-500">
                Use at least 8 characters with uppercase, lowercase, a number, and a special character.
              </p>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-luxury-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-luxury-300 rounded-xl text-luxury-900 placeholder-luxury-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 transition-all duration-300"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating Account...' : 'Join Wanderlove'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-luxury-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-gold-600 hover:text-gold-500 font-medium transition-colors duration-300"
              >
                Sign in
              </button>
            </p>
            <div className="mt-4 pt-4 border-t border-luxury-300">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('home')}
                className="text-sm"
              >
                ← Back to Home
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};