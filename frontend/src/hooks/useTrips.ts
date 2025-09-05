import { useState, useEffect } from 'react';
import { Trip } from '../types';
import { apiFetch } from '../api/client';
import { routes } from '../api/routes';

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeTrip = (raw: any): Trip => {
    const status = (raw?.status ?? raw?.tripStatus ?? 'draft') as Trip['status'];
    return {
      ...(raw || {}),
      id: raw?._id,
      status,
    } as Trip;
  };

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiFetch<any[]>(routes.trips.list());
      const formattedTrips = (data || []).map(normalizeTrip);
      setTrips(formattedTrips);
    } catch (e: any) {
      setError(e?.message || 'Failed to load trips');
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const createTrip = async (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    const newTrip = await apiFetch<any>(routes.trips.create(), {
      method: 'POST',
      body: tripData,
    });
    const formattedNewTrip = normalizeTrip(newTrip);
    setTrips(prevTrips => [...prevTrips, formattedNewTrip]);
    return formattedNewTrip;
  };

  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    const updatedTrip = await apiFetch<any>(routes.trips.update(id), {
      method: 'PATCH',
      body: updates,
    });
    const formattedUpdatedTrip = normalizeTrip(updatedTrip);
    setTrips(prevTrips =>
      prevTrips.map(trip => (trip.id === id ? formattedUpdatedTrip : trip))
    );
  };

  const deleteTrip = async (id: string) => {
    try {
      await apiFetch<void>(routes.trips.delete(id), { method: 'DELETE' });
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const getTripById = (id: string) => trips.find(trip => trip.id === id);

  return {
    trips,
    isLoading,
    error,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripById,
    reload: loadTrips,
  };
};
