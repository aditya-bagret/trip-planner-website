# Trip Planner MySQL Server

This is the MySQL backend for the Trip Planner application. It replaces the Firebase database with a local MySQL server.

## Prerequisites

- Node.js and npm installed
- MySQL server installed and running on your local machine

## Setup Instructions

1. **Create MySQL Database**

   Log in to your MySQL server and create a new database:

   ```sql
   CREATE DATABASE trip_planner;
   ```

2. **Configure Environment Variables**

   Update the `.env` file with your MySQL connection details:

   ```
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=trip_planner
   PORT=5000
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Initialize Database Schema**

   Run the initialization script to create the necessary tables:

   ```bash
   npm run init-db
   ```

5. **Start the Server**

   ```bash
   npm run dev
   ```

   The server will start on port 5000 by default.

## API Endpoints

### Users
- `POST /api/users` - Create or update a user
- `GET /api/users/:userEmail/trips` - Get all trips for a user

### Trips
- `POST /api/trips` - Create a new trip
- `GET /api/trips/:tripId` - Get a specific trip

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  picture VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Trips Table
```sql
CREATE TABLE trips (
  id VARCHAR(255) PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  budget VARCHAR(255),
  traveller VARCHAR(255),
  no_of_days INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_email) REFERENCES users(email)
)
```

### Trip Data Table
```sql
CREATE TABLE trip_data (
  id VARCHAR(255) PRIMARY KEY,
  trip_id VARCHAR(255) NOT NULL,
  data_type ENUM('hotel', 'plan') NOT NULL,
  data_json JSON NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
)
``` 