    export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    export const API_PATH = (import.meta.env.VITE_API_PATH ?? '/api') as string; // set to '' if no prefix
    const BASE = `${API_BASE_URL}${API_PATH}`;

    // Debug logging removed

    export const routes = {
      auth: {
        signup: () => `${BASE}/auth/signup`,
        login: () => `${BASE}/auth/login`,
        profile: () => `${BASE}/auth/profile`,
      },
      trips: {
        list: () => `${BASE}/trips`,
        create: () => `${BASE}/trips`,
        byId: (tripId: string) => `${BASE}/trips/${tripId}`,
        update: (tripId: string) => `${BASE}/trips/${tripId}`,
        delete: (tripId: string) => `${BASE}/trips/${tripId}`,
        itineraryByTrip: (tripId: string) => `${BASE}/trips/${tripId}/itinerary`,
        status: (tripId: string) => `${BASE}/trips/${tripId}/status`,
      },
      itineraries: {
        generate: () => `${BASE}/itineraries/generate`,
        byId: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}`,
        alternatives: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}/alternatives`,
        status: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}/status`,
        feedback: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}/feedback`,
        customize: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}/customize`,
        customized: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}/customized`,
        notes: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}/notes`,
        delete: (itineraryId: string) => `${BASE}/itineraries/${itineraryId}`,
      },
      cart: {
        add: (tripId: string) => `${BASE}/cart/${tripId}/add`,
        get: (tripId: string) => `${BASE}/cart/${tripId}`,
        getItem: (tripId: string, itemId: string) => `${BASE}/cart/${tripId}/items/${itemId}`,
        updateItem: (tripId: string, itemId: string) => `${BASE}/cart/${tripId}/items/${itemId}`,
        removeItem: (tripId: string, itemId: string) => `${BASE}/cart/${tripId}/items/${itemId}`,
        clear: (tripId: string) => `${BASE}/cart/${tripId}/clear`,
        budget: (tripId: string) => `${BASE}/cart/${tripId}/budget`,
        summaryAll: () => `${BASE}/cart/summary`,
      },
      external: {
        optionsAll: (tripId: string) => `${BASE}/options/${tripId}/all`,
        transport: (tripId: string, qs: string) => `${BASE}/options/${tripId}/transport${qs ? `?${qs}` : ''}`,
        accommodation: (tripId: string, qs: string) => `${BASE}/options/${tripId}/accommodation${qs ? `?${qs}` : ''}`,
        restaurants: (tripId: string, qs: string) => `${BASE}/options/${tripId}/restaurants${qs ? `?${qs}` : ''}`,
        addTransportToCart: (tripId: string) => `${BASE}/options/${tripId}/transport/add-to-cart`,
        addAccommodationToCart: (tripId: string) => `${BASE}/options/${tripId}/accommodation/add-to-cart`,
        addRestaurantToCart: (tripId: string) => `${BASE}/options/${tripId}/restaurants/add-to-cart`,
      },
      upload: {
        image: () => `${BASE}/upload/image`,
      },
    };

    export type Routes = typeof routes;

