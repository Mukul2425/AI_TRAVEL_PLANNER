import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMapsWrapper } from './GoogleMapsWrapper';
import { ItineraryMapData, Coordinates } from '../../api/mapsClient';
import { MapPin, Navigation, Clock, Route } from 'lucide-react';

interface ItineraryMapProps {
  itineraryMapData: ItineraryMapData;
  selectedDay?: number;
  onDaySelect?: (day: number) => void;
  className?: string;
}

interface MapMarker {
  position: Coordinates;
  title: string;
  activity: string;
  timeSlot: string;
  day: number;
  placeId: string;
}

export const ItineraryMap: React.FC<ItineraryMapProps> = ({
  itineraryMapData,
  selectedDay,
  onDaySelect,
  className = 'w-full h-96'
}) => {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Process itinerary data to create markers
  useEffect(() => {
    const newMarkers: MapMarker[] = [];
    
    itineraryMapData.locations.forEach(dayData => {
      dayData.locations.forEach(location => {
        newMarkers.push({
          position: location.coordinates,
          title: location.activity,
          activity: location.activity,
          timeSlot: location.timeSlot,
          day: location.day,
          placeId: location.place_id
        });
      });
    });
    
    setMarkers(newMarkers);
  }, [itineraryMapData]);

  // Clear existing polylines
  const clearPolylines = useCallback(() => {
    polylines.forEach(polyline => polyline.setMap(null));
    setPolylines([]);
  }, [polylines]);

  // Create polylines for routes
  const createPolylines = useCallback((map: google.maps.Map) => {
    clearPolylines();
    
    const newPolylines: google.maps.Polyline[] = [];
    
    // Create polylines for each day
    itineraryMapData.locations.forEach(dayData => {
      if (dayData.locations.length > 1) {
        for (let i = 0; i < dayData.locations.length - 1; i++) {
          const start = dayData.locations[i];
          const end = dayData.locations[i + 1];
          
          const polyline = new google.maps.Polyline({
            path: [
              { lat: start.coordinates.lat, lng: start.coordinates.lng },
              { lat: end.coordinates.lat, lng: end.coordinates.lng }
            ],
            geodesic: true,
            strokeColor: getDayColor(dayData.day),
            strokeOpacity: 0.8,
            strokeWeight: 3
          });
          
          polyline.setMap(map);
          newPolylines.push(polyline);
        }
      }
    });
    
    setPolylines(newPolylines);
  }, [itineraryMapData, clearPolylines]);

  // Get color for each day
  const getDayColor = (day: number): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[(day - 1) % colors.length];
  };

  // Get marker icon based on time slot
  const getMarkerIcon = (timeSlot: string, day: number): string => {
    const colors = {
      morning: '#FFD700', // Gold
      afternoon: '#FF6B6B', // Red
      evening: '#4ECDC4'   // Teal
    };
    
    const color = colors[timeSlot as keyof typeof colors] || '#45B7D1';
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${day}</text>
      </svg>
    `)}`;
  };

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    // Create info window
    const newInfoWindow = new google.maps.InfoWindow();
    setInfoWindow(newInfoWindow);

    // Create markers
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: map,
        title: markerData.title,
        icon: {
          url: getMarkerIcon(markerData.timeSlot, markerData.day),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        newInfoWindow.setContent(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-800">${markerData.activity}</h3>
            <p class="text-sm text-gray-600">Day ${markerData.day} - ${markerData.timeSlot}</p>
            <p class="text-xs text-gray-500 mt-1">Click to view details</p>
          </div>
        `);
        newInfoWindow.open(map, marker);
      });
    });

    // Create polylines
    createPolylines(map);

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend(marker.position);
      });
      map.fitBounds(bounds);
    }
  }, [markers, createPolylines]);

  // Update map when markers change
  useEffect(() => {
    if (markers.length > 0) {
      // This will be handled by the map load callback
    }
  }, [markers]);

  // Filter markers by selected day
  const filteredMarkers = selectedDay 
    ? markers.filter(marker => marker.day === selectedDay)
    : markers;

  return (
    <div className={`relative ${className}`}>
      {/* Day selector */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-wrap gap-1">
          {itineraryMapData.locations.map(dayData => (
            <button
              key={dayData.day}
              onClick={() => onDaySelect?.(dayData.day)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedDay === dayData.day
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedDay === dayData.day ? getDayColor(dayData.day) : undefined
              }}
            >
              Day {dayData.day}
            </button>
          ))}
          <button
            onClick={() => onDaySelect?.(undefined)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !selectedDay
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Days
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-semibold text-gray-800 mb-2">Legend</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
            <span>Morning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-400"></div>
            <span>Afternoon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-teal-400"></div>
            <span>Evening</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <GoogleMapsWrapper
        center={itineraryMapData.bounds ? {
          lat: (itineraryMapData.bounds.north + itineraryMapData.bounds.south) / 2,
          lng: (itineraryMapData.bounds.east + itineraryMapData.bounds.west) / 2
        } : undefined}
        className={className}
      >
        {(map, isLoaded) => {
          if (isLoaded && map) {
            handleMapLoad(map);
          }
          return null;
        }}
      </GoogleMapsWrapper>

      {/* Trip summary */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
          <Route className="w-4 h-4 mr-2" />
          Trip Summary
        </h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Destination:</strong> {itineraryMapData.destination}</p>
          <p><strong>Total Locations:</strong> {markers.length}</p>
          <p><strong>Days:</strong> {itineraryMapData.locations.length}</p>
          {itineraryMapData.routes.length > 0 && (
            <p><strong>Routes:</strong> {itineraryMapData.routes.length}</p>
          )}
        </div>
      </div>
    </div>
  );
};
