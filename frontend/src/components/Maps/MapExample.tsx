import React, { useState } from 'react';
import { LocationMap } from './LocationMap';
import { useLocationSearch } from '../../hooks/useMaps';
import { Button } from '../UI/Button';
import { Search, MapPin } from 'lucide-react';

/**
 * Example component showing how to use the map components
 * This can be used in trip creation, location selection, etc.
 */
export const MapExample: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('Dharamshala, India');
  const [showMap, setShowMap] = useState(false);
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedLocation: searchedLocation,
    loading,
    error,
    searchLocations,
    selectLocation,
    clearSelection
  } = useLocationSearch();

  const handleLocationSelect = (location: string, coordinates: any) => {
    setSelectedLocation(location);
    setShowMap(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Integration Example</h2>
        <p className="text-gray-600">This shows how to use the map components in your app</p>
      </div>

      {/* Location Search Example */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Search className="w-5 h-5 mr-2" />
          Location Search
        </h3>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocations(searchQuery)}
              placeholder="Search for a location..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button onClick={() => searchLocations(searchQuery)} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Search Results:</h4>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => selectLocation(result)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="font-medium">{result.address}</div>
                  <div className="text-sm text-gray-500">
                    {result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchedLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Selected Location:</h4>
              <p className="text-green-700">{searchedLocation.address}</p>
              <p className="text-sm text-green-600">
                Coordinates: {searchedLocation.coordinates.lat.toFixed(4)}, {searchedLocation.coordinates.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map Display Example */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Map Display
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Selected Location: <strong>{selectedLocation}</strong></p>
            <Button onClick={() => setShowMap(!showMap)}>
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
          </div>

          {showMap && (
            <LocationMap
              location={selectedLocation}
              className="w-full h-64"
              showSearch={true}
              onLocationSelect={handleLocationSelect}
            />
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use Maps in Your Components</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1. Import the components:</strong></p>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            {`import { LocationMap, ItineraryMap, TripOverviewMap } from '../Maps/...';`}
          </code>
          
          <p><strong>2. Use the hooks for data:</strong></p>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            {`import { useMaps, useItineraryMap, useLocationSearch } from '../../hooks/useMaps';`}
          </code>
          
          <p><strong>3. Add to your component:</strong></p>
          <code className="block bg-blue-100 p-2 rounded text-xs">
            {`<LocationMap location="Dharamshala" className="w-full h-64" />`}
          </code>
        </div>
      </div>
    </div>
  );
};
