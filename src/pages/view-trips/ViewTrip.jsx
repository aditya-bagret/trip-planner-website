import { Footer } from "@/components/common/Footer";
import { Navbar } from "@/components/common/Navbar";
import { HotelSection } from "@/components/view-trip/HotelSection";
import { InfoSection } from "@/components/view-trip/InfoSection";
import { VisitSection } from "@/components/view-trip/VisitSection";
import { getTripById } from "@/service/mysqlApi";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

export const ViewTrip = () => {
  const { tripId } = useParams();
  const [tripData, setTripData] = useState([]);
  
  const getTripData = async () => {
    try {
      const data = await getTripById(tripId);
      setTripData(data);
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast("No Trip Found");
    }
  };
  
  useEffect(() => {
    getTripData();
  }, [tripId]);
  
  return (
    <div>
      <Navbar />
      <div className="p-10 md:px-20 lg:px-44 xl:px-56">
        {/* Information Section */}
        <InfoSection trip={tripData} />
        {/* Hotels */}
        <HotelSection trip={tripData} />
        {/* Daily plan */}
        <VisitSection trip={tripData} />
      </div>
      <Footer/>
    </div>
  );
};
