import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { FaMapLocationDot } from "react-icons/fa6";
import { Link } from "react-router-dom";
// Replace Google Places imports with OSM API
// import { getPlaceDetails, PHOTO_REF_URL } from "@/service/globalApi";
import { getPlacePhoto, getMapUrl } from "@/service/osmApi";

export const PlaceCardItem = ({ place }) => {
  const [photoUrl, setPhotoUrl] = useState();
  
  const GetPlacePhoto = async () => {
    try {
      // Use Flickr API to get a photo of the place
      const imageUrl = await getPlacePhoto(place.PlaceName);
      setPhotoUrl(imageUrl);
    } catch (error) {
      console.error("Error fetching place photo:", error);
    }
  };
  
  useEffect(() => {
    place && GetPlacePhoto();
  }, [place]);
  
  return (
    <Link
      // Replace Google Maps URL with OpenStreetMap URL
      to={getMapUrl(place?.PlaceName)}
      target="_blank"
    >
      <div className="border p-3 rounded-xl flex gap-5 hover:scale-105 transition-all hover:shadow-sm cursor-pointer">
        <img
          src={photoUrl ? photoUrl : "/placeholder.jpg"}
          className="w-[100px] h-[130px] rounded-xl object-cover"
        />
        <div>
          <h2 className="font-bold text-lg">{place.PlaceName}</h2>
          <p className="text-sm text-gray-600">{place.PlaceDetails}</p>
          <h2 className="mt-2">🕗 {place.TimeTravel}</h2>
          {/* <Button> <FaMapLocationDot /></Button> */}
        </div>
      </div>
    </Link>
  );
};
