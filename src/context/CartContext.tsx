import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { CartItem } from '../types';
import { apiFetch } from '../api/client';
import { routes } from '../api/routes';

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>, tripId?: string) => void;
  updateItemQuantity: (itemId: string, quantity: number, tripId?: string) => void;
  removeItem: (itemId: string, tripId?: string) => void;
  clear: (tripId?: string) => void;
  total: number;
  count: number;
  isLoading: boolean;
  error: string | null;
  loadCartForTrip: (tripId: string) => Promise<void>;
  currentTripId: string | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  })();

  // Load cart for a specific trip
  const loadCartForTrip = async (tripId: string) => {
    if (!tripId) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentTripId(tripId);
    
    try {
      // Try to load cart from API for this trip
      const data = await apiFetch<CartItem[]>(routes.cart.get(tripId));
      setItems(data);
    } catch (err: any) {
      // Fallback to local storage if API is not available
      const storedCart = localStorage.getItem(`cart_trip_${tripId}`);
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          setItems(parsedCart);
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart from local storage on initial load (fallback)
  useEffect(() => {
    if (!user?.id) return;
    
    // Try to load from any available trip cart in local storage
    const loadFromLocalStorage = () => {
      const keys = Object.keys(localStorage);
      const cartKeys = keys.filter(key => key.startsWith('cart_trip_'));
      
      if (cartKeys.length > 0) {
        // Load the first available trip cart
        const firstCartKey = cartKeys[0];
        const tripId = firstCartKey.replace('cart_trip_', '');
        const storedCart = localStorage.getItem(firstCartKey);
        
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            setItems(parsedCart);
            setCurrentTripId(tripId);
          } catch {
            setItems([]);
          }
        }
      }
    };
    
    loadFromLocalStorage();
  }, [user?.id]);

  const addItem = async (item: Omit<CartItem, 'id'>, tripId?: string) => {
    const targetTripId = tripId || currentTripId;
    if (!targetTripId) {
      return;
    }
    
    const newItem: CartItem = {
      ...item,
      id: Date.now().toString(), // Generate local ID
    };
    
    try {
      // Try to add to API first
      await apiFetch<CartItem>(routes.cart.add(targetTripId), { method: 'POST', body: item });
    } catch (err: any) {
      // Fallback to local storage
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      localStorage.setItem(`cart_trip_${targetTripId}`, JSON.stringify(updatedItems));
      return;
    }
    
    // If API call succeeded, refresh from API
    try {
      const data = await apiFetch<CartItem[]>(routes.cart.get(targetTripId));
      setItems(data);
    } catch {
      // If refresh fails, use local state
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
    }
  };

  const updateItemQuantity = async (itemId: string, quantity: number, tripId?: string) => {
    const targetTripId = tripId || currentTripId;
    if (!targetTripId) {
      return;
    }
    
    try {
      // Try to update via API first
      await apiFetch<CartItem>(routes.cart.updateItem(targetTripId, itemId), { method: 'PUT', body: { quantity } });
    } catch (err: any) {
      // Fallback to local storage
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
      setItems(updatedItems);
      localStorage.setItem(`cart_trip_${targetTripId}`, JSON.stringify(updatedItems));
      return;
    }
    
    // If API call succeeded, refresh from API
    try {
      const data = await apiFetch<CartItem[]>(routes.cart.get(targetTripId));
      setItems(data);
    } catch {
      // If refresh fails, use local state
      const updatedItems = items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      );
      setItems(updatedItems);
    }
  };

  const removeItem = async (itemId: string, tripId?: string) => {
    const targetTripId = tripId || currentTripId;
    if (!targetTripId) {
      return;
    }
    
    try {
      // Try to remove via API first
      await apiFetch<void>(routes.cart.removeItem(targetTripId, itemId), { method: 'DELETE' });
    } catch (err: any) {
      // Fallback to local storage
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
      localStorage.setItem(`cart_trip_${targetTripId}`, JSON.stringify(updatedItems));
      return;
    }
    
    // If API call succeeded, refresh from API
    try {
      const data = await apiFetch<CartItem[]>(routes.cart.get(targetTripId));
      setItems(data);
    } catch {
      // If refresh fails, use local state
      const updatedItems = items.filter(item => item.id !== itemId);
      setItems(updatedItems);
    }
  };

  const clear = async (tripId?: string) => {
    const targetTripId = tripId || currentTripId;
    if (!targetTripId) {
      return;
    }
    
    try {
      // Try to clear via API first
      await apiFetch<void>(routes.cart.clear(targetTripId), { method: 'POST' });
    } catch (err: any) {
      // Fallback to local storage
      setItems([]);
      localStorage.removeItem(`cart_trip_${targetTripId}`);
      return;
    }
    
    // If API call succeeded, clear local state
    setItems([]);
  };

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  
  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clear,
    total,
    count,
    isLoading,
    error,
    loadCartForTrip,
    currentTripId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
