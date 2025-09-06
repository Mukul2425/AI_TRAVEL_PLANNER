import React, { useEffect, useState } from 'react';
import { GoogleMapsWrapper } from './GoogleMapsWrapper';
import { ItineraryMapData, Coordinates } from '../../api/mapsClient';
import { MapPin, Navigation, Clock, Route, Calendar } from 'lucide-react';

interface TripOverviewMapProps {
  itineraryMapData: ItineraryMapData;
  className?: string;
  showDayMarkers?: boolean;
}

export const TripOverviewMap: React.FC<TripOverviewMapProps> = ({
  itineraryMapData,
  className = 'w-full h-96',
  showDayMarkers = true
}) => {
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);

  // Get color for each day
  const getDayColor = (day: number): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[(day - 1) % colors.length];
  };

  // Handle map load
  const handleMapLoad = (map: google.maps.Map) => {
    // Create info window
    const newInfoWindow = new google.maps.InfoWindow();
    setInfoWindow(newInfoWindow);

    const newMarkers: google.maps.Marker[] = [];
    const newPolylines: google.maps.Polyline[] = [];

    // Create markers for each day
    itineraryMapData.locations.forEach(dayData => {
      if (showDayMarkers) {
        // Create a single marker for each day (first location of the day)
        const firstLocation = dayData.locations[0];
        if (firstLocation) {
          const marker = new google.maps.Marker({
            position: firstLocation.coordinates,
            map: map,
            title: `Day ${dayData.day}`,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="${getDayColor(dayData.day)}" stroke="white" stroke-width="3"/>
                  <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${dayData.day}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(40, 40)
            }
          });

          marker.addListener('click', () => {
            const dayActivities = dayData.locations.map(loc => 
              `<div class="mb-2">
                <div class="font-medium">${loc.activity}</div>
                <div class="text-sm text-gray-600">${loc.timeSlot}</div>
              </div>`
            ).join('');

            newInfoWindow.setContent(`
              <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-gray-800 mb-2">Day ${dayData.day} - ${dayData.date}</h3>
                <div class="space-y-1">
                  ${dayActivities}
                </div>
              </div>
            `);
            newInfoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        }
      } else {
        // Create markers for all locations
        dayData.locations.forEach((location, index) => {
          const marker = new google.maps.Marker({
            position: location.coordinates,
            map: map,
            title: location.activity,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="${getDayColor(dayData.day)}" stroke="white" stroke-width="2"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${index + 1}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(24, 24)
            }
          });

          marker.addListener('click', () => {
            newInfoWindow.setContent(`
              <div class="p-2">
                <h3 class="font-semibold text-gray-800">${location.activity}</h3>
                <p class="text-sm text-gray-600">Day ${dayData.day} - ${location.timeSlot}</p>
                <p class="text-xs text-gray-500 mt-1">${location.formatted_address}</p>
              </div>
            `);
            newInfoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        });
      }

      // Create polylines for each day
      if (dayData.locations.length > 1) {
        const path = dayData.locations.map(loc => ({
          lat: loc.coordinates.lat,
          lng: loc.coordinates.lng
        }));

        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: getDayColor(dayData.day),
          strokeOpacity: 0.8,
          strokeWeight: 3
        });

        polyline.setMap(map);
        newPolylines.push(polyline);
      }
    });

    setMarkers(newMarkers);
    setPolylines(newPolylines);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!);
      });
      map.fitBounds(bounds);
    }
  };

  // Calculate trip statistics
  const totalLocations = itineraryMapData.locations.reduce((sum, day) => sum + day.locations.length, 0);
  const totalDays = itineraryMapData.locations.length;
  const totalRoutes = itineraryMapData.routes.length;

  return (
    <div className={`relative ${className}`}>
      {/* Trip statistics */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Trip Overview
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">{totalLocations} locations</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">{totalDays} days</span>
          </div>
          <div className="flex items-center space-x-2">
            <Route className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600">{totalRoutes} routes</span>
          </div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">{itineraryMapData.destination}</span>
          </div>
        </div>
      </div>

      {/* Day legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
        <h4 className="font-semibold text-gray-800 mb-2">Days</h4>
        <div className="space-y-1">
          {itineraryMapData.locations.map(dayData => (
            <div key={dayData.day} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getDayColor(dayData.day) }}
              ></div>
              <span className="text-gray-600">Day {dayData.day}</span>
              <span className="text-gray-400">({dayData.locations.length} stops)</span>
            </div>
          ))}
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

      {/* Toggle view button */}
      <div className="absolute bottom-4 left-4 z-10">
        <button
          onClick={() => window.location.reload()} // Simple way to toggle
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
        >
          <Navigation className="w-4 h-4" />
          <span>Toggle View</span>
        </button>
      </div>
    </div>
  );
};
