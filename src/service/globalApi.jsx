import axios from "axios";

// NOTE: This file is kept for reference but we have migrated to using OpenStreetMap APIs
// Please use the osmApi.jsx file for place-related functionality


const BASE_URL = "https://places.googleapis.com/v1/places:searchText";

const config = {
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_PLACE_API_KEY,
    "X-Goog-FieldMask": ["places.photos", "places.displayName", "places.id"],
  },
};

//xexport const getPlaceDetails = (data) => axios.post(BASE_URL, data, config);

export const PHOTO_REF_URL = `https://places.googleapis.com/v1/{NAME}/media?maxWidthPx=1000&maxHeightPx=1000&key=${
  import.meta.env.VITE_GOOGLE_PLACE_API_KEY
}`;


// Import and re-export from osmApi to maintain compatibility with existing code
import { getPlaceDetails, getPlacePhoto, getMapUrl } from "./osmApi";
export { getPlaceDetails, getPlacePhoto, getMapUrl };
