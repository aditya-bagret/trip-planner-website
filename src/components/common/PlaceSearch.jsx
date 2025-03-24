import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";

export const PlaceSearch = ({ onSelectPlace, placeholder }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        // Using Photon API (based on OpenStreetMap)
        const response = await axios.get(
          `https://photon.komoot.io/api/?q=${query}&limit=5`
        );
        setSuggestions(response.data.features);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching place suggestions:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectPlace = (place) => {
    // Format the place data to match what the app expects (similar to Google Places format)
    const placeData = {
      label: place.properties.name 
             + (place.properties.city ? `, ${place.properties.city}` : '') 
             + (place.properties.state ? `, ${place.properties.state}` : '')
             + (place.properties.country ? `, ${place.properties.country}` : ''),
      value: place.properties.osm_id,
      // Add additional properties that might be used elsewhere in the app
      properties: {
        ...place.properties,
        coordinates: place.geometry.coordinates
      }
    };
    
    onSelectPlace(placeData);
    setQuery(placeData.label);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Search for a place"}
        className="w-full"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border">
          <ul className="py-1">
            {suggestions.map((place, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectPlace(place)}
              >
                {place.properties.name}
                {place.properties.city && `, ${place.properties.city}`}
                {place.properties.state && `, ${place.properties.state}`}
                {place.properties.country && `, ${place.properties.country}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 