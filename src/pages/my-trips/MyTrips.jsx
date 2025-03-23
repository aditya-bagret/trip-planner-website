import { Navbar } from "@/components/common/Navbar";
import { MyTripCard } from "@/components/user-trip/MyTripCard";
import { getUserTrips } from "@/service/mysqlApi";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const MyTrips = () => {
  const navigate = useNavigate();
  const [userTrips, setUserTrips] = useState([]);
  
  const getUsertrips = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/");
      return;
    }

    try {
      const trips = await getUserTrips(user.email);
      setUserTrips(trips);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      setUserTrips([]);
    }
  };
  
  useEffect(() => {
    getUsertrips();
  }, []);
  
  return (
    <div>
      <Navbar />
      <div className="sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10">
        <h2 className="font-bold text-2xl">My Trips</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {userTrips?.length > 0
            ? userTrips.map((item, index) => (
                <MyTripCard key={index} item={item} index={index} />
              ))
            : [1, 2, 3].map((item, index) => (
                <div
                  key={index}
                  className="h-[250px] w-full bg-slate-200 animate-pulse rounded-md"
                ></div>
              ))}
        </div>
      </div>
    </div>
  );
};
