import { Navbar } from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AI_PROMPT,
  selectBudgetOptions,
  SelectTravelsList,
} from "@/constants/options";
import { chatSession } from "@/service/AIModal";
import React, { useEffect, useState } from "react";
import { PlaceSearch } from "@/components/common/PlaceSearch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FcGoogle } from "react-icons/fc";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { saveTrip, saveUser } from "@/service/mysqlApi";
import { Loading } from "@/components/common/Loading";
import { useNavigate } from "react-router-dom";

export const CreateTrip = () => {
  const navigate = useNavigate();
  const [place, setPlace] = useState();
  const [formData, setFormData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    console.log(formData);
  }, [formData]);

  const handleLogin = useGoogleLogin({
    onSuccess: (response) => GetUserProfile(response),
    onError: (error) => console.log(error),
  });

  const generateTrip = async () => {
    let errorMessage = "";

    const user = localStorage.getItem("user");
    if (!user) {
      setOpenDialog(true);
      return;
    }

    if (formData?.noOfDays > 5 || formData?.noOfDays <= 0) {
      errorMessage = "Number of days should be between 1 and 5.";
    } else {
      if (!formData?.location) {
        errorMessage = "Location is required.";
      } else if (!formData?.budget) {
        errorMessage = "Budget is required.";
      } else if (!formData?.traveller) {
        errorMessage = "Traveller details are required.";
      }
    }

    if (errorMessage) {
      toast(errorMessage);
      return;
    }

    setLoading(true);

    const FINAL_PROMPT = AI_PROMPT.replace(
      "{location}",
      formData?.location?.label
    )
      .replace("{totalDays}", formData?.noOfDays)
      .replace("{traveler}", formData?.traveller)
      .replace("{budget}", formData?.budget)
      .replace("{totalDays}", formData?.noOfDays);

    try {
      console.log("Sending prompt to AI:", FINAL_PROMPT);
      const result = await chatSession.sendMessage(FINAL_PROMPT);
      console.log("Raw AI result:", result);
      console.log("AI response text:", result?.response?.text());
      
      if (!result?.response?.text()) {
        throw new Error("No trip data received from AI");
      }
      
      const responseText = result.response.text();
      console.log("Response text to be processed:", responseText);
      
      await processAndSaveTrip(responseText);
    } catch (error) {
      console.error("Error generating trip:", error);
      toast.error(error.message || "An error occurred while generating the trip.");
    } finally {
      setLoading(false);
    }
  };

  const processAndSaveTrip = async (tripData) => {
    setLoading(true);

    const docId = Date.now().toString();
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user?.email) {
      console.error("No user email found in localStorage");
      toast.error("Please login again to continue");
      setLoading(false);
      return;
    }

    let parsedTripData;
    try {
      console.log("Attempting to parse trip data:", tripData);
      parsedTripData = JSON.parse(tripData);
      
      // Check if the data is in the expected format
      if (!parsedTripData) {
        throw new Error("Invalid trip data format");
      }

      // Handle both array format and object format
      if (Array.isArray(parsedTripData)) {
        console.log("Received array format, converting to object format");
        if (parsedTripData.length >= 2) {
          parsedTripData = {
            hotels: parsedTripData[0],
            plans: parsedTripData[1],
          };
        } else {
          throw new Error("Invalid array format in trip data");
        }
      } else if (typeof parsedTripData === 'object') {
        console.log("Received object format");
        // If we have a direct object with hotels and itinerary keys
        if (parsedTripData.hotels && parsedTripData.itinerary) {
          parsedTripData = {
            hotels: parsedTripData.hotels,
            plans: parsedTripData.itinerary
          };
        }
        // If we already have hotels and plans keys, keep as is
        else if (!parsedTripData.hotels || !parsedTripData.plans) {
          throw new Error("Missing required data in trip response");
        }
      } else {
        throw new Error("Unexpected data format in AI response");
      }

      console.log("Successfully parsed trip data:", parsedTripData);
      
      // Validate the data structure
      if (!Array.isArray(parsedTripData.hotels) || !Array.isArray(parsedTripData.plans)) {
        throw new Error("Hotels and plans must be arrays");
      }

      if (parsedTripData.hotels.length === 0 || parsedTripData.plans.length === 0) {
        throw new Error("No hotels or plans found in the response");
      }

    } catch (error) {
      console.error("Error parsing tripData:", error);
      toast.error(error.message || "Failed to process trip data. Please try again.");
      setLoading(false);
      return;
    }

    try {
      console.log("Saving trip with data:", {
        id: docId,
        userSelection: formData,
        tripData: parsedTripData,
        userEmail: user?.email
      });

      const savedTrip = await saveTrip({
        id: docId,
        userSelection: formData,
        tripData: parsedTripData,
        userEmail: user?.email,
      });
      
      console.log("Trip saved successfully:", savedTrip);
      toast.success("Trip generated successfully!");
      setLoading(false);
      navigate(`/view-trip/${docId}`);
    } catch (error) {
      setLoading(false);
      console.error("Error saving trip:", error);
      toast.error(error.response?.data?.error || "Failed to save trip. Please try again.");
    }
  };

  const GetUserProfile = (tokenInfo) => {
    console.log('Token info received:', tokenInfo);
    axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokenInfo?.access_token}`,
            Accept: "Application/json",
          },
        }
      )
      .then(async (response) => {
        console.log('Google API response:', response.data);
        const userData = response.data;
        
        try {
          // Format user data to match our database schema
          const formattedUserData = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture
          };
          
          console.log('Attempting to save user data:', formattedUserData);
          
          // Save user to database
          const savedUser = await saveUser(formattedUserData);
          console.log('User saved successfully:', savedUser);
          
          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(formattedUserData));
          
          // Close dialog and proceed with trip generation
          setOpenDialog(false);
          generateTrip();
        } catch (error) {
          console.error("Error saving user data:", error.response?.data || error.message);
          toast.error(error.response?.data?.error || "Failed to save user data. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error.response?.data || error.message);
        toast.error("Failed to get user profile. Please try again.");
      });
  };
  return (
    <>
      <Navbar />
      <div className="sm:px-10 md:px-32 lg:px-56 xl:px-72 px-5 mt-10">
        <h2 className="font-bold text-3xl">
          Tell us your travel preferences ⛱️ 🌴{" "}
        </h2>
        <p className="mt-3 text-gray-500 text-xl">
          Just provide some basic information, and our trip planner will
          generate a customized itinerary based on your preferences.
        </p>

        <div className="mt-10 flex flex-col gap-10">
          <div>
            <h2 className="text-xl my-3 font-medium">
              What is destination of choice? *️
            </h2>
            <PlaceSearch
              onSelectPlace={(place) => {
                setPlace(place);
                handleInputChange("location", place);
              }}
              placeholder="Enter a destination"
            />
          </div>

          <div>
            <h2 className="text-xl my-3 font-medium">
              How many days are you planning your trip? *️
            </h2>
            <Input
              placeholder={"Ex.3"}
              type="number"
              onChange={(e) => handleInputChange("noOfDays", e.target.value)}
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl my-3 font-medium">What is Your Budget ? *️</h2>
          <div className="grid grid-cols-3 gap-5 mt-5">
            {selectBudgetOptions.map((item, index) => (
              <div
                key={index}
                className={`p-4 border cursor-pointer rounded-lg 
                hover:shadow-lg
                ${formData?.budget === item.title && "shadow-lg border-black"}`}
                onClick={() => handleInputChange("budget", item.title)}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="font-bold text-lg">{item.title}</h2>
                <h2 className="text-gray-500 text-sm">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl my-3 font-medium">
            Who do you plan on traveling with on your next adventure ? *️
          </h2>
          <div className="grid grid-cols-3 gap-5 mt-5">
            {SelectTravelsList.map((item, index) => (
              <div
                key={index}
                className={`p-4 border cursor-pointer rounded-lg hover:shadow-lg
                  ${
                    formData?.traveller === item.people &&
                    "shadow-lg border-black"
                  }`}
                onClick={() => handleInputChange("traveller", item.people)}
              >
                <h2 className="text-4xl">{item.icon}</h2>
                <h2 className="font-bold text-lg">{item.title}</h2>
                <h2 className="text-gray-500 text-sm">{item.desc}</h2>
              </div>
            ))}
          </div>
        </div>
        <div className="my-10 flex justify-center">
          <Button onClick={generateTrip} disabled={loading}>
            Generate Trip {loading && <Loading />}
          </Button>
        </div>
        <Dialog open={openDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogDescription>
                <img src="/mainlogo.png" className="w-28 md:w-40" />
                <h2 className="font-bold text-lg mt-7">Sign In with Google</h2>
                <p> Sign In to the App with Google authentication </p>
                <Button
                  className="w-full mt-5 flex items-center gap-2 "
                  onClick={handleLogin}
                >
                  <FcGoogle className="h-5 w-5" /> Sign In with Google
                </Button>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
