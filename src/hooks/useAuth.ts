import { useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch } from '../api/client';
import { routes } from '../api/routes';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          } catch {
            localStorage.removeItem('user');
          }
        } else if (storedUser === 'undefined' || storedUser === 'null') {
          localStorage.removeItem('user');
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();

    // Listen for auth changes triggered elsewhere in the app
    const handleAuthChanged = () => {
      const updated = localStorage.getItem('user');
      if (updated && updated !== 'undefined' && updated !== 'null') {
        try {
          const parsed = JSON.parse(updated);
          setUser(parsed);
        } catch {
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('auth-changed', handleAuthChanged as EventListener);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChanged as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    
    try {
      const res = await apiFetch<{ _id: string; name: string; email: string; token: string }>(routes.auth.login(), {
        method: 'POST',
        body: { email, password },
      });
      
      
      
      // Transform the response to match our User interface
      const user: User = {
        id: res._id,
        name: res.name,
        email: res.email,
        isPremium: false, // Default value
        goldenMiles: 0, // Default value
        memberSince: new Date().toISOString().split('T')[0], // Default to today
      };
      
      
      
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      // Notify other hook instances (e.g., Navbar) in the same tab
      window.dispatchEvent(new Event('auth-changed'));
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, confirmPassword?: string) => {
    
    try {
      const res = await apiFetch<{ _id: string; name: string; email: string; token: string }>(routes.auth.signup(), {
        method: 'POST',
        body: { name, email, password, ...(confirmPassword ? { confirmPassword } : {}) },
      });
      
      
      
      // Transform the response to match our User interface
      const user: User = {
        id: res._id,
        name: res.name,
        email: res.email,
        isPremium: false, // Default value
        goldenMiles: 0, // Default value
        memberSince: new Date().toISOString().split('T')[0], // Default to today
      };
      
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      // Notify other hook instances (e.g., Navbar) in the same tab
      window.dispatchEvent(new Event('auth-changed'));
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    // Notify other hook instances (e.g., Navbar) in the same tab
    window.dispatchEvent(new Event('auth-changed'));
  };

  return {
    user,
    isLoading,
    login,
    signup,
    logout,
  };
};