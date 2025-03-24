const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
// Use a different port for the API server than the MySQL port
// MySQL runs on port 3306, our API server should run on a different port
const API_PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// User Routes
app.post('/api/users', async (req, res) => {
  try {
    console.log('Received user data:', req.body);
    const { id, email, name, picture } = req.body;
    
    if (!email) {
      console.error('Email is required');
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Existing users:', existingUsers);
    
    if (existingUsers.length > 0) {
      console.log('User already exists, returning existing user');
      return res.json(existingUsers[0]);
    }
    
    // Create new user
    console.log('Creating new user with data:', { id, email, name, picture });
    await pool.query(
      'INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)',
      [id, email, name, picture]
    );
    
    console.log('User created successfully');
    res.status(201).json({ id, email, name, picture });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', details: error.message });
  }
});

// Trip Routes
app.post('/api/trips', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    console.log('Received trip data:', req.body);
    const { id, userSelection, tripData, userEmail } = req.body;
    
    if (!id || !userEmail) {
      return res.status(400).json({ error: 'Trip ID and user email are required' });
    }
    
    await connection.beginTransaction();
    
    // Insert trip
    console.log('Inserting trip with data:', {
      id,
      userEmail,
      location: userSelection.location?.label,
      budget: userSelection.budget,
      traveller: userSelection.traveller,
      noOfDays: userSelection.noOfDays
    });
    
    await connection.query(
      'INSERT INTO trips (id, user_email, location, budget, traveller, no_of_days) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id, 
        userEmail, 
        userSelection.location?.label || '',
        userSelection.budget || '',
        userSelection.traveller || '',
        userSelection.noOfDays || 0
      ]
    );
    
    // Insert hotel data
    if (tripData.hotels && tripData.hotels.length > 0) {
      console.log('Inserting hotel data for trip:', id);
      await connection.query(
        'INSERT INTO trip_data (id, trip_id, data_type, data_json) VALUES (?, ?, ?, ?)',
        [
          `${id}_hotels`, 
          id, 
          'hotel', 
          JSON.stringify(tripData.hotels)
        ]
      );
    }
    
    // Insert plan data
    if (tripData.plans && tripData.plans.length > 0) {
      console.log('Inserting plan data for trip:', id);
      await connection.query(
        'INSERT INTO trip_data (id, trip_id, data_type, data_json) VALUES (?, ?, ?, ?)',
        [
          `${id}_plans`, 
          id, 
          'plan', 
          JSON.stringify(tripData.plans)
        ]
      );
    }
    
    await connection.commit();
    console.log('Trip saved successfully:', id);
    res.status(201).json({ id });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating trip:', error);
    res.status(500).json({ 
      error: 'Failed to create trip',
      details: error.message,
      code: error.code
    });
  } finally {
    connection.release();
  }
});

// Get a specific trip
app.get('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    console.log('Fetching trip with ID:', tripId);
    
    // Get trip details
    const [trips] = await pool.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    console.log('Found trips:', trips);
    
    if (trips.length === 0) {
      console.log('No trip found with ID:', tripId);
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Get trip data (hotels and plans)
    console.log('Fetching trip data for trip:', tripId);
    const [tripDataRows] = await pool.query(
      'SELECT data_type, data_json FROM trip_data WHERE trip_id = ?',
      [tripId]
    );
    console.log('Found trip data rows:', tripDataRows);
    
    const tripData = {
      hotels: [],
      plans: []
    };
    
    tripDataRows.forEach(row => {
      const parsedData = JSON.parse(row.data_json);
      if (row.data_type === 'hotel') {
        tripData.hotels = parsedData;
      } else if (row.data_type === 'plan') {
        tripData.plans = parsedData;
      }
    });
    
    console.log('Formatted trip data:', tripData);
    
    const response = {
      id: tripId,
      userSelection: {
        location: { label: trips[0].location },
        budget: trips[0].budget,
        traveller: trips[0].traveller,
        noOfDays: trips[0].no_of_days
      },
      tripData,
      userEmail: trips[0].user_email
    };
    
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trip',
      details: error.message,
      code: error.code
    });
  }
});

// Get all trips for a user
app.get('/api/users/:userEmail/trips', async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    // Get all trips for the user
    const [trips] = await pool.query(
      'SELECT t.*, td_hotels.data_json as hotels, td_plans.data_json as plans FROM trips t ' +
      'LEFT JOIN trip_data td_hotels ON t.id = td_hotels.trip_id AND td_hotels.data_type = "hotel" ' +
      'LEFT JOIN trip_data td_plans ON t.id = td_plans.trip_id AND td_plans.data_type = "plan" ' +
      'WHERE t.user_email = ?',
      [userEmail]
    );
    
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      userSelection: {
        location: { label: trip.location },
        budget: trip.budget,
        traveller: trip.traveller,
        noOfDays: trip.no_of_days
      },
      tripData: {
        hotels: trip.hotels ? JSON.parse(trip.hotels) : [],
        plans: trip.plans ? JSON.parse(trip.plans) : []
      },
      userEmail: trip.user_email
    }));
    
    res.json(formattedTrips);
  } catch (error) {
    console.error('Error fetching user trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

app.listen(API_PORT, () => {
  console.log(`API Server running on port ${API_PORT}`);
}); 