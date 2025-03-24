import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { IoIosSend } from "react-icons/io";
import { getPlaceDetails, PHOTO_REF_URL } from "@/service/globalApi";

export const InfoSection = ({ data }) => {
  const [placeImage, setPlaceImage] = useState("");

  const GetPlacePhoto = async () => {
    try {
      if (!data?.placeName) {
        console.log("No place name provided");
        return;
      }

      const response = await getPlaceDetails(data.placeName);
      if (response?.data?.places?.[0]?.preview?.source) {
        setPlaceImage(response.data.places[0].preview.source);
      } else {
        console.log("No image found for place:", data.placeName);
        // Use the placeImageUrl from the AI response as fallback
        setPlaceImage(data.placeImageUrl || "");
      }
    } catch (error) {
      console.error("Error fetching place photo:", error);
      // Use the placeImageUrl from the AI response as fallback
      setPlaceImage(data.placeImageUrl || "");
    }
  };

  useEffect(() => {
    GetPlacePhoto();
  }, [data]);

  if (!data) {
    return null;
  }

  return (
    <div className="mt-5">
      <div className="flex gap-5 items-center">
        <img
          src={placeImage || "/placeholder.jpg"}
          className="w-[150px] h-[100px] rounded-lg object-cover"
          alt={data.placeName || "Place"}
        />
        <div>
          <h2 className="font-bold text-xl">{data.placeName || "No name available"}</h2>
          <h2 className="text-gray-500 text-sm mt-2">
            {data.placeDetails || "No details available"}
          </h2>
          <div className="flex gap-5 mt-2">
            <h2 className="text-sm">⭐ {data.rating || "N/A"}</h2>
            <h2 className="text-sm">⏰ {data.timeTravel || "N/A"}</h2>
            <h2 className="text-sm">💰 {data.ticketPricing || "N/A"}</h2>
          </div>
        </div>
      </div>
    </div>
  );
};
