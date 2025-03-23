const pool = require('./db');

async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        picture VARCHAR(1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create trips table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(255) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        budget VARCHAR(255),
        traveller VARCHAR(255),
        no_of_days INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email)
      )
    `);
    
    // Create trip_data table for storing trip details (hotels, plans, etc.)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_data (
        id VARCHAR(255) PRIMARY KEY,
        trip_id VARCHAR(255) NOT NULL,
        data_type ENUM('hotel', 'plan') NOT NULL,
        data_json JSON NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      )
    `);
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
  } finally {
    // Close the pool
    pool.end();
  }
}

initDatabase(); 