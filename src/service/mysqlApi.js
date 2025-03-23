import axios from 'axios';

// API server runs on port 5000, MySQL runs on port 3306
const API_BASE_URL = 'http://localhost:5000/api';

// User related API calls
export const saveUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Trip related API calls
export const saveTrip = async (tripData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/trips`, tripData);
    return response.data;
  } catch (error) {
    console.error('Error saving trip:', error);
    throw error;
  }
};

export const getTripById = async (tripId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/trips/${tripId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
};

export const getUserTrips = async (userEmail) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userEmail}/trips`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user trips:', error);
    throw error;
  }
}; 