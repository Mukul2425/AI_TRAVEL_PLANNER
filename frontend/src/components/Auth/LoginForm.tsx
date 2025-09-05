import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { Button } from '../UI/Button';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
  onNavigate: (view: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await login(email, password);
      onNavigate('home');
    } catch (error: any) {
      
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
          <h1 className="text-4xl font-serif font-bold text-luxury-900 mb-2">Welcome Back</h1>
          <p className="text-luxury-700">Sign in to your luxury account</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your password"
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
            </div>

            <Button 
              type="submit" 
              size="lg" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-luxury-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="text-gold-600 hover:text-gold-500 font-medium transition-colors duration-300"
              >
                Join the elite
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