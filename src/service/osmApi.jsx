import axios from "axios";

// Function to get place details from Nominatim (OpenStreetMap)
export const getPlaceDetails = async (query) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          // Identify our app (required by Nominatim usage policy)
          "User-Agent": "TripPlanner/1.0"
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
};

// Function to get an image for a place using Flickr API
export const getPlacePhoto = async (placeName) => {
  try {
    // This uses Flickr API - you could register for a free API key at https://www.flickr.com/services/api/
    // For this implementation we're using a sample search that works without API key
    const response = await axios.get(
      `https://api.flickr.com/services/feeds/photos_public.gne?tags=${encodeURIComponent(placeName)}&format=json&nojsoncallback=1`
    );
    
    // Return the first image URL if available, otherwise return null
    if (response.data && response.data.items && response.data.items.length > 0) {
      return response.data.items[0].media.m.replace('_m', '_b'); // Get larger image
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching place photo:", error);
    return null; // Return null so the app can fall back to a placeholder
  }
};

// Function to get OSM map URL for a place
export const getMapUrl = (placeName) => {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(placeName)}`;
}; 