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
    const { id, email, name, picture } = req.body;
    
    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUsers.length > 0) {
      return res.json(existingUsers[0]);
    }
    
    // Create new user
    await pool.query(
      'INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)',
      [id, email, name, picture]
    );
    
    res.status(201).json({ id, email, name, picture });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Trip Routes
app.post('/api/trips', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id, userSelection, tripData, userEmail } = req.body;
    
    // Insert trip
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
    res.status(201).json({ id });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  } finally {
    connection.release();
  }
});

// Get a specific trip
app.get('/api/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Get trip details
    const [trips] = await pool.query('SELECT * FROM trips WHERE id = ?', [tripId]);
    
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    // Get trip data (hotels and plans)
    const [tripDataRows] = await pool.query(
      'SELECT data_type, data_json FROM trip_data WHERE trip_id = ?',
      [tripId]
    );
    
    const tripData = {};
    
    tripDataRows.forEach(row => {
      tripData[row.data_type === 'hotel' ? 'hotels' : 'plans'] = JSON.parse(row.data_json);
    });
    
    res.json({
      id: tripId,
      userSelection: {
        location: { label: trips[0].location },
        budget: trips[0].budget,
        traveller: trips[0].traveller,
        noOfDays: trips[0].no_of_days
      },
      tripData,
      userEmail: trips[0].user_email
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
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