import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlacePhoto, getMapUrl } from "@/service/osmApi";

export const HotelCard = ({ item, index }) => {
  const [photoUrl, setPhotoUrl] = useState();
  
  const GetPlacePhoto = async () => {
    try {
      const searchTerm = `${item?.HotelName} ${item?.HotelAddress} hotel`;
      const imageUrl = await getPlacePhoto(searchTerm);
      setPhotoUrl(imageUrl);
    } catch (error) {
      console.error("Error fetching hotel photo:", error);
    }
  };
  
  useEffect(() => {
    item && GetPlacePhoto();
  }, [item]);
  
  return (
    <Link
      to={getMapUrl(`${item?.HotelName} ${item?.HotelAddress}`)}
      target="_blank"
    >
      <div id={index} className="hover:scale-105 transition-all cursor-pointer">
        <img
          src={photoUrl || "/placeholder.jpg"}
          className="rounded-xl h-[180px] w-full object-cover"
        />
        <div className="my-2 flex flex-col gap-2">
          <h2 className="font-medium">{item?.HotelName}</h2>
          <h2 className="text-xs text-gray-500">📍 {item?.HotelAddress}</h2>
          <h2 className="text-sm">💰 {item?.Price}</h2>
          <h2 className="text-sm">⭐ {item?.Rating}</h2>
        </div>
      </div>
    </Link>
  );
};
