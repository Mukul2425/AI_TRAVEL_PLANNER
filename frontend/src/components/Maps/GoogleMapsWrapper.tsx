import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapsWrapperProps {
  children: (map: google.maps.Map | null, isLoaded: boolean) => React.ReactNode;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
}

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading map...</span>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium">Failed to load map</p>
            <p className="text-red-500 text-sm mt-1">Please check your API key configuration</p>
          </div>
        </div>
      );
    default:
      return null;
  }
};

const MapComponent: React.FC<{
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  onMapLoad: (map: google.maps.Map) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ center, zoom, onMapLoad, className, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new google.maps.Map(ref.current, {
        center: center || { lat: 32.2206, lng: 76.3201 }, // Default to Dharamshala
        zoom: zoom || 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      
      setMap(newMap);
      onMapLoad(newMap);
    }
  }, [ref, map, center, zoom, onMapLoad]);

  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  return <div ref={ref} className={className} style={style} />;
};

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({
  children,
  center,
  zoom,
  className = 'w-full h-64',
  style
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleMapLoad = (loadedMap: google.maps.Map) => {
    setMap(loadedMap);
    setIsLoaded(true);
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <div className="flex items-center justify-center h-64 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-center">
          <div className="text-yellow-500 text-2xl mb-2">🔑</div>
          <p className="text-yellow-600 font-medium">Google Maps API Key Required</p>
          <p className="text-yellow-500 text-sm mt-1">Please configure VITE_GOOGLE_MAPS_API_KEY in your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <Wrapper apiKey={apiKey} render={render} libraries={['places', 'geometry']}>
      <MapComponent
        center={center}
        zoom={zoom}
        onMapLoad={handleMapLoad}
        className={className}
        style={style}
      />
      {children(map, isLoaded)}
    </Wrapper>
  );
};
