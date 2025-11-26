import React, { useEffect, useState } from 'react';
import { GoogleMapsWrapper } from './GoogleMapsWrapper';
import { Coordinates } from '../../api/mapsClient';
import { MapPin, Navigation } from 'lucide-react';

interface LocationMapProps {
  location: string;
  coordinates?: Coordinates;
  zoom?: number;
  className?: string;
  showSearch?: boolean;
  onLocationSelect?: (location: string, coordinates: Coordinates) => void;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  coordinates,
  zoom = 15,
  className = 'w-full h-64',
  showSearch = false,
  onLocationSelect
}) => {
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  // Handle map load
  const handleMapLoad = (map: google.maps.Map) => {
    // Create info window
    const newInfoWindow = new google.maps.InfoWindow();
    setInfoWindow(newInfoWindow);

    // Create marker if coordinates are provided
    if (coordinates) {
      const newMarker = new google.maps.Marker({
        position: coordinates,
        map: map,
        title: location,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#FF6B6B" stroke="white" stroke-width="2"/>
              <path d="M16 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" fill="white"/>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      newMarker.addListener('click', () => {
        newInfoWindow.setContent(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-800">${location}</h3>
            <p class="text-sm text-gray-600">${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}</p>
          </div>
        `);
        newInfoWindow.open(map, newMarker);
      });

      setMarker(newMarker);
    }

    // Add search box if enabled
    if (showSearch) {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search for a location...';
      input.className = 'w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';
      
      const searchBoxElement = new google.maps.places.SearchBox(input);
      setSearchBox(searchBoxElement);

      // Add search box to map
      map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

      // Listen for places changed
      searchBoxElement.addListener('places_changed', () => {
        const places = searchBoxElement.getPlaces();
        if (places && places.length > 0) {
          const place = places[0];
          if (place.geometry && place.geometry.location) {
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            
            // Update marker
            if (marker) {
              marker.setPosition(coords);
            } else {
              const newMarker = new google.maps.Marker({
                position: coords,
                map: map,
                title: place.name || 'Selected Location',
                icon: {
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="12" fill="#4ECDC4" stroke="white" stroke-width="2"/>
                      <path d="M16 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" fill="white"/>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(32, 32)
                }
              });
              setMarker(newMarker);
            }

            // Update map center
            map.setCenter(coords);
            map.setZoom(15);

            // Call callback
            onLocationSelect?.(place.name || 'Selected Location', coords);
          }
        }
      });
    }
  };

  // Update marker when coordinates change
  useEffect(() => {
    if (marker && coordinates) {
      marker.setPosition(coordinates);
    }
  }, [marker, coordinates]);

  return (
    <div className={`relative ${className}`}>
      <GoogleMapsWrapper
        center={coordinates}
        zoom={zoom}
        className={className}
      >
        {(map, isLoaded) => {
          if (isLoaded && map) {
            handleMapLoad(map);
          }
          return null;
        }}
      </GoogleMapsWrapper>

      {/* Location info overlay */}
      {location && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="font-medium text-gray-800">{location}</span>
          </div>
          {coordinates && (
            <p className="text-sm text-gray-600 mt-1">
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
